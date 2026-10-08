import * as fs from "node:fs/promises";
import { resolveSafePath } from "../utils/pathSecurity.js";

export async function strReplace(
  workspaceRoot: string,
  relativePath: string,
  oldString: string,
  newString: string
): Promise<void> {
  const safePath = resolveSafePath(workspaceRoot, relativePath);

  const content = await fs.readFile(safePath, "utf8");

  if (!content.includes(oldString)) {
    throw new Error("The text to replace was not found in the file.");
  }

  const updatedContent = content.replace(oldString, newString);

  await fs.writeFile(safePath, updatedContent, "utf8");
}