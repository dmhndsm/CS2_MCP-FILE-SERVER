import * as fs from "node:fs/promises";
import * as path from "node:path";
import { resolveSafePath } from "../utils/pathSecurity.js";

export async function getTree(
  workspaceRoot: string
): Promise<string> {
  const rootPath = resolveSafePath(workspaceRoot, "");

  async function buildTree(
    currentPath: string,
    prefix: string
  ): Promise<string[]> {
    const entries = await fs.readdir(currentPath, {
      withFileTypes: true,
    });

    entries.sort((a, b) => a.name.localeCompare(b.name));

    const lines: string[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const isLast = i === entries.length - 1;
      const branch = isLast ? "└── " : "├── ";
      const fullPath = path.join(currentPath, entry.name);

      lines.push(`${prefix}${branch}${entry.name}`);

      if (entry.isDirectory()) {
        const childPrefix = prefix + (isLast ? "    " : "│   ");
        lines.push(...(await buildTree(fullPath, childPrefix)));
      }
    }

    return lines;
  }

  const lines = await buildTree(rootPath, "");

  return lines.length > 0 ? lines.join("\n") : "The workspace is empty.";
}