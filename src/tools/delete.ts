import * as fs from "node:fs/promises";
import { resolveSafePath } from "../utils/pathSecurity.js";

export async function deleteFile(
  workspaceRoot: string,
  relativePath: string
): Promise<void> {
  const safePath = resolveSafePath(workspaceRoot, relativePath);

  await fs.unlink(safePath);
}