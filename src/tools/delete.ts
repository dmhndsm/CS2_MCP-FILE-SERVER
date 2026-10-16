import * as fs from "node:fs/promises";
import * as path from "node:path";
import { resolveSafePath } from "../utils/pathSecurity.js";
import { audit } from "../utils/auditLog.js";

// Handoff records must survive between agent sessions.
export const PROTECTED_FILES = new Set([
  "PROJECT_STATE.md",
  "PLAN_LOG.md",
  "CHECKPOINTS.md",
  "DECISIONS.md",
]);

export async function deleteFile(
  workspaceRoot: string,
  relativePath: string
): Promise<void> {
  const safePath = resolveSafePath(workspaceRoot, relativePath);
  const rel = path.relative(path.resolve(workspaceRoot), safePath);

  if (PROTECTED_FILES.has(rel)) {
    audit("delete", { path: relativePath }, "denied");
    throw new Error(`Refusing to delete protected handoff file: ${rel}`);
  }

  const stats = await fs.lstat(safePath);
  if (stats.isDirectory()) {
    audit("delete", { path: relativePath }, "denied");
    throw new Error("delete only removes files, not directories.");
  }

  await fs.unlink(safePath);
  audit("delete", { path: relativePath });
}
