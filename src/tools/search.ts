import * as fs from "node:fs/promises";
import * as path from "node:path";
import { resolveSafePath } from "../utils/pathSecurity.js";

export async function searchFiles(
  workspaceRoot: string,
  query: string
): Promise<string[]> {
  const rootPath = resolveSafePath(workspaceRoot, "");

  const results: string[] = [];

  async function searchDirectory(currentPath: string): Promise<void> {
    const entries = await fs.readdir(currentPath, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await searchDirectory(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      try {
        const content = await fs.readFile(fullPath, "utf8");

        if (content.includes(query)) {
          const relativePath = path.relative(rootPath, fullPath);
          results.push(relativePath);
        }
      } catch {
        // Skip files that cannot be read as text.
      }
    }
  }

  await searchDirectory(rootPath);

  return results;
}