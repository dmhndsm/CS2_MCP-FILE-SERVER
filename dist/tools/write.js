import * as fs from "node:fs/promises";
import { resolveSafePath } from "../utils/pathSecurity.js";
export async function writeFile(workspaceRoot, relativePath, content) {
    const safePath = resolveSafePath(workspaceRoot, relativePath);
    await fs.writeFile(safePath, content, "utf8");
}
