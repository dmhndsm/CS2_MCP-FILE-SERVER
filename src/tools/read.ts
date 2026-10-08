import * as fs from "node:fs/promises";
import { resolveSafePath } from "../utils/pathSecurity.js";

export async function readFile(
  workspaceRoot: string,
  relativePath: string
): Promise<string> {
  const safePath = resolveSafePath(workspaceRoot, relativePath);

  return fs.readFile(safePath, "utf8");
}