import * as path from "node:path";
import * as fs from "node:fs";

function isOutside(rel: string): boolean {
  return rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel);
}

/**
 * Resolve a user-supplied relative path against the workspace root and make
 * sure neither the lexical path nor any symlink on the way leaves the root.
 * Uses lstat so dangling symlinks (which existsSync reports as missing) are
 * still detected instead of being skipped.
 */
export function resolveSafePath(
  workspaceRoot: string,
  relativePath: string
): string {
  if (relativePath.includes("\0")) {
    throw new Error("Access denied: invalid path.");
  }

  const normalizedRoot = path.resolve(workspaceRoot);
  const resolvedPath = path.resolve(normalizedRoot, relativePath);

  if (isOutside(path.relative(normalizedRoot, resolvedPath))) {
    throw new Error("Access denied: path is outside the workspace.");
  }

  // Find the nearest ancestor that exists as a filesystem entry (a dangling
  // symlink counts as existing for lstat).
  let currentPath = resolvedPath;
  for (;;) {
    try {
      fs.lstatSync(currentPath);
      break;
    } catch {
      const parentPath = path.dirname(currentPath);
      if (parentPath === currentPath) {
        throw new Error("Unable to validate workspace path.");
      }
      currentPath = parentPath;
    }
  }

  let realTarget: string;
  try {
    realTarget = fs.realpathSync(currentPath);
  } catch {
    // Dangling symlink: its target cannot be verified, so refuse it.
    throw new Error("Access denied: broken or unresolvable symbolic link.");
  }

  const realRoot = fs.realpathSync(normalizedRoot);
  if (isOutside(path.relative(realRoot, realTarget))) {
    throw new Error("Access denied: symbolic link points outside the workspace.");
  }

  return resolvedPath;
}
