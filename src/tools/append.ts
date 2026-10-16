import { appendFile as fsAppendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { resolveSafePath } from "../utils/pathSecurity.js";
import { audit } from "../utils/auditLog.js";

export async function appendFile(
  workspaceRoot: string,
  relativePath: string,
  content: string
): Promise<void> {
  const safePath = resolveSafePath(workspaceRoot, relativePath);

  await mkdir(path.dirname(safePath), { recursive: true });
  // Re-validate after creating parents, before touching the file.
  resolveSafePath(workspaceRoot, relativePath);

  await fsAppendFile(safePath, content, "utf8");
  audit("append", { path: relativePath, bytes: Buffer.byteLength(content) });
}
