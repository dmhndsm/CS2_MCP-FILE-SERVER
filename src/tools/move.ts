import * as fs from "node:fs/promises";
import { audit } from "../utils/auditLog.js";
import { resolveSafePath } from "../utils/pathSecurity.js";

export async function moveFile(
  workspaceRoot: string,
  sourcePath: string,
  destinationPath: string
): Promise<void> {
  const safeSourcePath = resolveSafePath(workspaceRoot, sourcePath);
  const safeDestinationPath = resolveSafePath(
    workspaceRoot,
    destinationPath
  );

  await fs.rename(safeSourcePath, safeDestinationPath);
  audit("move", { from: sourcePath, to: destinationPath });
}