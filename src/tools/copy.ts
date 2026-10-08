import * as fs from "node:fs/promises";
import { resolveSafePath } from "../utils/pathSecurity.js";

export async function copyFile(
  workspaceRoot: string,
  sourcePath: string,
  destinationPath: string
): Promise<void> {
  const safeSourcePath = resolveSafePath(workspaceRoot, sourcePath);
  const safeDestinationPath = resolveSafePath(
    workspaceRoot,
    destinationPath
  );

  await fs.copyFile(safeSourcePath, safeDestinationPath);
}