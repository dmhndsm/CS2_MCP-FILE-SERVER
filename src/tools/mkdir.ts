import * as fs from "node:fs/promises";
import { resolveSafePath } from "../utils/pathSecurity.js";

export async function makeDirectory(
  workspaceRoot: string,
  relativePath: string
): Promise<void> {
  const safePath = resolveSafePath(workspaceRoot, relativePath);

  await fs.mkdir(safePath, {
    recursive: true,
  });
}