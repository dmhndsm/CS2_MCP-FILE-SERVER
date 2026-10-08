import { appendFile as fsAppendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export async function appendFile(
  workspaceRoot: string,
  relativePath: string,
  content: string
): Promise<void> {
  const root = path.resolve(workspaceRoot);
  const target = path.resolve(root, relativePath);

  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error("Access denied: path is outside the workspace.");
  }

  await mkdir(path.dirname(target), { recursive: true });

  await fsAppendFile(target, content, "utf8");
}