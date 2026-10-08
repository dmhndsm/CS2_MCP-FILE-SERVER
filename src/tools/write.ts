import * as fs from "node:fs/promises";
import { resolveSafePath } from "../utils/pathSecurity.js";

export async function writeFile(
  workspaceRoot: string,
  relativePath: string,
  content: string
): Promise<void> {
  const safePath = resolveSafePath(workspaceRoot, relativePath);

  await fs.writeFile(safePath, content, "utf8");
}