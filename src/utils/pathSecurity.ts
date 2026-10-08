import * as path from "node:path";

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

  return resolvedPath;
}