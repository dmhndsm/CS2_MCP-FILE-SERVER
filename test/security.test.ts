import test from "node:test";
import assert from "node:assert/strict";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

process.env.AUDIT_LOG = "off";
const { resolveSafePath } = await import("../src/utils/pathSecurity.js");
const { appendFile } = await import("../src/tools/append.js");
const { writeFile } = await import("../src/tools/write.js");
const { readFile } = await import("../src/tools/read.js");
const { deleteFile } = await import("../src/tools/delete.js");
const { moveFile } = await import("../src/tools/move.js");
const { copyFile } = await import("../src/tools/copy.js");
const { strReplace } = await import("../src/tools/str_replace.js");
const { makeDirectory } = await import("../src/tools/mkdir.js");
const { getFileInfo } = await import("../src/tools/file_info.js");
const { searchFiles } = await import("../src/tools/search.js");
const { getTree } = await import("../src/tools/tree.js");
const { listFiles } = await import("../src/tools/list.js");

const base = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-sec-"));
const ws = path.join(base, "ws");
const outside = path.join(base, "outside");
fs.mkdirSync(ws); fs.mkdirSync(outside);
fs.writeFileSync(path.join(outside, "secret.txt"), "TOP-SECRET");
fs.writeFileSync(path.join(ws, "ok.txt"), "hello world");
const canSymlink = (() => {
  try { fs.symlinkSync(outside, path.join(ws, "link-dir")); fs.symlinkSync(path.join(outside, "secret.txt"), path.join(ws, "link-file")); fs.symlinkSync(path.join(outside, "not-yet.txt"), path.join(ws, "dangling")); return true; } catch { return false; }
})();

const denied = /Access denied|Unable to validate/;

test("normal paths work", async () => {
  await writeFile(ws, "a/b.txt", "x");
  assert.equal(await readFile(ws, "a/b.txt"), "x");
});

for (const bad of ["../outside/secret.txt", "../../etc/passwd", "/etc/passwd", "a/../../outside/secret.txt", "ok.txt\0.png"]) {
  test(`traversal rejected by every tool: ${JSON.stringify(bad)}`, async () => {
    await assert.rejects(readFile(ws, bad), denied);
    await assert.rejects(writeFile(ws, bad, "x"), denied);
    await assert.rejects(appendFile(ws, bad, "x"), denied);
    await assert.rejects(strReplace(ws, bad, "a", "b"), denied);
    await assert.rejects(deleteFile(ws, bad), denied);
    await assert.rejects(moveFile(ws, bad, "z.txt"), denied);
    await assert.rejects(moveFile(ws, "ok.txt", bad), denied);
    await assert.rejects(copyFile(ws, bad, "z.txt"), denied);
    await assert.rejects(copyFile(ws, "ok.txt", bad), denied);
    await assert.rejects(makeDirectory(ws, bad), denied);
    await assert.rejects(getFileInfo(ws, bad), denied);
    await assert.rejects(listFiles(ws, bad), denied);
  });
}

test("sibling-prefix directory is not treated as inside", () => {
  fs.mkdirSync(ws + "-evil", { recursive: true });
  assert.throws(() => resolveSafePath(ws, "../ws-evil/x"), denied);
});

test("symlink escapes rejected (incl. append regression)", { skip: !canSymlink }, async () => {
  await assert.rejects(readFile(ws, "link-file"), denied);
  await assert.rejects(appendFile(ws, "link-file", "PWNED"), denied);
  await assert.rejects(appendFile(ws, "link-dir/secret.txt", "PWNED"), denied);
  await assert.rejects(writeFile(ws, "link-dir/new.txt", "PWNED"), denied);
  await assert.rejects(makeDirectory(ws, "link-dir/sub"), denied);
  assert.equal(fs.readFileSync(path.join(outside, "secret.txt"), "utf8"), "TOP-SECRET");
  assert.equal(fs.existsSync(path.join(outside, "new.txt")), false);
});

test("dangling symlink cannot be written through", { skip: !canSymlink }, async () => {
  await assert.rejects(writeFile(ws, "dangling", "PWNED"), denied);
  await assert.rejects(appendFile(ws, "dangling", "PWNED"), denied);
  assert.equal(fs.existsSync(path.join(outside, "not-yet.txt")), false);
});

test("search and tree do not follow symlinks out of the workspace", { skip: !canSymlink }, async () => {
  assert.deepEqual(await searchFiles(ws, "TOP-SECRET"), []);
  assert.ok(!(await getTree(ws)).includes("secret.txt"));
});

test("delete is gated: handoff files and directories are protected", async () => {
  fs.writeFileSync(path.join(ws, "PLAN_LOG.md"), "keep");
  await assert.rejects(deleteFile(ws, "PLAN_LOG.md"), /protected/);
  fs.mkdirSync(path.join(ws, "dir"), { recursive: true });
  await assert.rejects(deleteFile(ws, "dir"), /not directories/);
  await deleteFile(ws, "a/b.txt");
});

test("useful errors for missing files / failed replace", async () => {
  await assert.rejects(readFile(ws, "nope.txt"), /ENOENT/);
  await assert.rejects(strReplace(ws, "ok.txt", "zzz", "y"), /not found/);
});

test("append creates and extends files", async () => {
  await appendFile(ws, "log/x.txt", "1");
  await appendFile(ws, "log/x.txt", "2");
  assert.equal(await readFile(ws, "log/x.txt"), "12");
});
