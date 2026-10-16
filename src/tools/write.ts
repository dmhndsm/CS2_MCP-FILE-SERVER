import * as fs from "node:fs/promises";
import * as path from "node:path";
import { audit } from "../utils/auditLog.js";
import { resolveSafePath } from "../utils/pathSecurity.js";

export async function writeFile(
  workspaceRoot: string,
  relativePath: string,
  content: string
): Promise<void> {
  const safePath = resolveSafePath(workspaceRoot, relativePath);

  await fs.mkdir(path.dirname(safePath), { recursive: true });
  resolveSafePath(workspaceRoot, relativePath);
  await fs.writeFile(safePath, content, "utf8");
  audit("write", { path: relativePath, bytes: Buffer.byteLength(content) });
}