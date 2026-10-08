import * as fs from "node:fs/promises";
import * as path from "node:path";
import { resolveSafePath } from "../utils/pathSecurity.js";

export async function getFileInfo(
  workspaceRoot: string,
  relativePath: string
): Promise<{
  name: string;
  size: number;
  type: string;
  modified: string;
}> {
  const safePath = resolveSafePath(workspaceRoot, relativePath);
  const stats = await fs.stat(safePath);

  return {
    name: path.basename(safePath),
    size: stats.size,
    type: stats.isFile() ? "file" : "directory",
    modified: stats.mtime.toISOString(),
  };
}