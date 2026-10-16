import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const PORT = 3911;
const TOKEN = "t".repeat(40);
const URL_ = `http://127.0.0.1:${PORT}`;
const ws = fs.mkdtempSync(path.join(os.tmpdir(), "mcp-http-"));
const auditLog = path.join(ws, "..", `audit-${process.pid}.log`);
let proc: ChildProcess;

const headers = (token = TOKEN) => ({
  "Content-Type": "application/json",
  Accept: "application/json, text/event-stream",
  Authorization: `Bearer ${token}`,
});

async function rpc(method: string, params: unknown, id = 1) {
  const res = await fetch(`${URL_}/mcp`, { method: "POST", headers: headers(), body: JSON.stringify({ jsonrpc: "2.0", id, method, params }) });
  const text = await res.text();
  const data = text.split("\n").find((l) => l.startsWith("data:"))?.slice(5) ?? text;
  return { status: res.status, body: JSON.parse(data) };
}

before(async () => {
  proc = spawn(process.execPath, ["dist/httpServer.js"], {
    env: { ...process.env, PORT: String(PORT), HOST: "127.0.0.1", MCP_AUTH_TOKEN: TOKEN, WORKSPACE_ROOT: ws, AUDIT_LOG: auditLog },
    stdio: ["ignore", "pipe", "inherit"],
  });
  await new Promise<void>((resolve, reject) => {
    proc.stdout!.on("data", (d) => String(d).includes("listening") && resolve());
    proc.on("exit", (c) => reject(new Error("server exited " + c)));
    setTimeout(() => reject(new Error("startup timeout")), 15000);
  });
});
after(() => proc.kill());

test("health endpoint is open", async () => {
  assert.equal((await fetch(`${URL_}/health`)).status, 200);
});
test("missing / wrong token -> 401", async () => {
  assert.equal((await fetch(`${URL_}/mcp`, { method: "POST", body: "{}" })).status, 401);
  assert.equal((await fetch(`${URL_}/mcp`, { method: "POST", headers: headers("x".repeat(40)), body: "{}" })).status, 401);
});
test("wrong path -> 404", async () => {
  assert.equal((await fetch(`${URL_}/other`, { headers: headers() })).status, 404);
});
test("oversized body -> 413 and server survives", async () => {
  const res = await fetch(`${URL_}/mcp`, { method: "POST", headers: headers(), body: "a".repeat(1024 * 1024 + 10) });
  assert.equal(res.status, 413);
  assert.equal((await fetch(`${URL_}/health`)).status, 200);
});
test("initialize + tools/list returns 13 tools", async () => {
  const init = await rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } });
  assert.equal(init.status, 200);
  const list = await rpc("tools/list", {}, 2);
  assert.equal(list.body.result.tools.length, 13);
});
test("write/read/append over HTTP and traversal is an isError result", async () => {
  await rpc("tools/call", { name: "write", arguments: { path: "demo.txt", content: "hi" } }, 3);
  await rpc("tools/call", { name: "append", arguments: { path: "demo.txt", content: "!" } }, 4);
  const r = await rpc("tools/call", { name: "read", arguments: { path: "demo.txt" } }, 5);
  assert.equal(r.body.result.content[0].text, "hi!");
  const bad = await rpc("tools/call", { name: "read", arguments: { path: "../../etc/passwd" } }, 6);
  assert.equal(bad.body.result.isError, true);
  const inval = await rpc("tools/call", { name: "read", arguments: { path: "" } }, 7);
  assert.ok(inval.body.error || inval.body.result?.isError);
});
test("destructive calls are audit-logged", () => {
  const log = fs.readFileSync(auditLog, "utf8");
  assert.match(log, /"tool":"write"/);
  assert.match(log, /"tool":"append"/);
});
