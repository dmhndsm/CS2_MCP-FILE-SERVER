import * as fs from "node:fs/promises";
import { resolveSafePath } from "../utils/pathSecurity.js";
export async function listFiles(workspaceRoot, relativePath) {
    const safePath = resolveSafePath(workspaceRoot, relativePath);
    const entries = await fs.readdir(safePath, {
        withFileTypes: true,
    });
    return entries.map((entry) => entry.isDirectory() ? `${entry.name}/` : entry.name);
}
