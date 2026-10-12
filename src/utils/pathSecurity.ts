import * as path from "node:path";
import * as fs from "node:fs";

export function resolveSafePath(
  workspaceRoot: string,
  relativePath: string
): string {
  const normalizedRoot = path.resolve(workspaceRoot);
  const resolvedPath = path.resolve(normalizedRoot, relativePath);

  const relativeToRoot = path.relative(normalizedRoot, resolvedPath);

  if (
    relativeToRoot === ".." ||
    relativeToRoot.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeToRoot)
  ) {
    throw new Error("Access denied: path is outside the workspace.");
  }

  // Check whether the existing target or its nearest existing parent
  // resolves through a symbolic link outside the workspace.
  let currentPath = resolvedPath;

  while (!fs.existsSync(currentPath)) {
    const parentPath = path.dirname(currentPath);

    if (parentPath === currentPath) {
      throw new Error("Unable to validate workspace path.");
    }

    currentPath = parentPath;
  }

  const realRoot = fs.realpathSync(normalizedRoot);
  const realTarget = fs.realpathSync(currentPath);
  const realRelative = path.relative(realRoot, realTarget);

  if (
    realRelative === ".." ||
    realRelative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(realRelative)
  ) {
    throw new Error("Access denied: symbolic link points outside the workspace.");
  }

  return resolvedPath;
}
