
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { resolveSafePath } from "../utils/pathSecurity.js";
import { audit } from "../utils/auditLog.js";

export async function deleteFolder(
  workspaceRoot: string,
  relativePath: string,
): Promise<void> {
  const safePath = resolveSafePath(workspaceRoot, relativePath);
  const normalizedRoot = path.resolve(workspaceRoot);

  if (safePath === normalizedRoot) {
    throw new Error("Cannot delete the workspace root.");
  }

  const stats = await fs.lstat(safePath);

  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new Error("Target must be an existing directory, not a symlink.");
  }

  await fs.rm(safePath, {
    recursive: true,
    force: false,
  });

  audit("delete_folder", { path: relativePath });
}
