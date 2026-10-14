import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

import path from "node:path";
import { fileURLToPath } from "node:url";

import { listFiles } from "./tools/list.js";
import { readFile } from "./tools/read.js";
import { writeFile } from "./tools/write.js";
import { appendFile } from "./tools/append.js";
import { strReplace } from "./tools/str_replace.js";
import { deleteFile } from "./tools/delete.js";
import { searchFiles } from "./tools/search.js";
import { moveFile } from "./tools/move.js";
import { makeDirectory } from "./tools/mkdir.js";
import { getFileInfo } from "./tools/file_info.js";
import { copyFile } from "./tools/copy.js";
import { getTree } from "./tools/tree.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workspaceRoot = process.env.WORKSPACE_ROOT
  ? path.resolve(process.env.WORKSPACE_ROOT)
  : path.resolve(__dirname, "../workspace");

export function createServer() {
  const server = new McpServer({
    name: "secure-mcp-file-server",
    version: "1.0.0",
  });

  // Workspace info
  server.registerTool(
    "workspace_info",
    {
      description: "Get information about the MCP file workspace.",
    },
    async () => {
      return {
        content: [
          {
            type: "text",
            text: `Workspace: ${workspaceRoot}`,
          },
        ],
      };
    },
  );

  // Read
  server.registerTool(
    "read",
    {
      description: "Read the contents of a file inside the workspace.",
      inputSchema: {
        path: z.string().describe("Relative path of the file to read"),
      },
    },
    async ({ path: filePath }) => {
      try {
        const content = await readFile(workspaceRoot, filePath);

        return {
          content: [
            {
              type: "text",
              text: content,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error reading file: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // List
  server.registerTool(
    "list",
    {
      description: "List files inside the workspace.",
    },
    async () => {
      try {
        const files = await listFiles(workspaceRoot, "");

        return {
          content: [
            {
              type: "text",
              text:
                files.length > 0 ? files.join("\n") : "The workspace is empty.",
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing files: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Write
  server.registerTool(
    "write",
    {
      description: "Create or overwrite a file inside the workspace.",
      inputSchema: {
        path: z.string().describe("Relative path of the file to write"),
        content: z.string().describe("Content to write into the file"),
      },
    },
    async ({ path: filePath, content }) => {
      try {
        await writeFile(workspaceRoot, filePath, content);

        return {
          content: [
            {
              type: "text",
              text: `File written successfully: ${filePath}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error writing file: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Append
  server.registerTool(
    "append",
    {
      description: "Append content to a file inside the workspace.",
      inputSchema: {
        path: z.string().describe("Relative path of the file"),
        content: z.string().describe("Content to append"),
      },
    },
    async ({ path: filePath, content }) => {
      try {
        await appendFile(workspaceRoot, filePath, content);

        return {
          content: [
            {
              type: "text",
              text: `Content appended successfully: ${filePath}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error appending to file: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Replace
  server.registerTool(
    "str_replace",
    {
      description:
        "Replace a specific piece of text in a file inside the workspace.",
      inputSchema: {
        path: z.string().describe("Relative path of the file"),
        oldString: z.string().describe("Exact text to find and replace"),
        newString: z.string().describe("Text that will replace the old text"),
      },
    },
    async ({ path: filePath, oldString, newString }) => {
      try {
        await strReplace(workspaceRoot, filePath, oldString, newString);

        return {
          content: [
            {
              type: "text",
              text: `Text replaced successfully: ${filePath}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error replacing text: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Delete
  server.registerTool(
    "delete",
    {
      description: "Delete a file inside the workspace.",
      inputSchema: {
        path: z.string().describe("Relative path of the file to delete"),
      },
    },
    async ({ path: filePath }) => {
      try {
        await deleteFile(workspaceRoot, filePath);

        return {
          content: [
            {
              type: "text",
              text: `File deleted successfully: ${filePath}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error deleting file: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Search
  server.registerTool(
    "search",
    {
      description: "Search for text inside workspace files.",
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe("Text to search for inside workspace files"),
      },
    },
    async ({ query }) => {
      try {
        const results = await searchFiles(workspaceRoot, query);

        return {
          content: [
            {
              type: "text",
              text:
                results.length > 0
                  ? results.join("\n")
                  : `No files found containing: ${query}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error searching files: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Move
  server.registerTool(
    "move",
    {
      description: "Move or rename a file inside the workspace.",
      inputSchema: {
        sourcePath: z.string().describe("Current relative path of the file"),
        destinationPath: z.string().describe("New relative path of the file"),
      },
    },
    async ({ sourcePath, destinationPath }) => {
      try {
        await moveFile(workspaceRoot, sourcePath, destinationPath);

        return {
          content: [
            {
              type: "text",
              text: `File moved successfully: ${sourcePath} -> ${destinationPath}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error moving file: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Make directory
  server.registerTool(
    "mkdir",
    {
      description: "Create a directory inside the workspace.",
      inputSchema: {
        path: z.string().describe("Relative path of the directory to create"),
      },
    },
    async ({ path: directoryPath }) => {
      try {
        await makeDirectory(workspaceRoot, directoryPath);

        return {
          content: [
            {
              type: "text",
              text: `Directory created successfully: ${directoryPath}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating directory: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // File info
  server.registerTool(
    "file_info",
    {
      description: "Get information about a file inside the workspace.",
      inputSchema: {
        path: z.string().describe("Relative path of the file"),
      },
    },
    async ({ path: filePath }) => {
      try {
        const info = await getFileInfo(workspaceRoot, filePath);

        return {
          content: [
            {
              type: "text",
              text: [
                `Name: ${info.name}`,
                `Size: ${info.size} bytes`,
                `Type: ${info.type}`,
                `Modified: ${info.modified}`,
              ].join("\n"),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting file information: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Copy
  server.registerTool(
    "copy",
    {
      description: "Copy a file inside the workspace.",
      inputSchema: {
        sourcePath: z.string().describe("Relative path of the source file"),
        destinationPath: z
          .string()
          .describe("Relative path of the copied file"),
      },
    },
    async ({ sourcePath, destinationPath }) => {
      try {
        await copyFile(workspaceRoot, sourcePath, destinationPath);

        return {
          content: [
            {
              type: "text",
              text: `File copied successfully: ${sourcePath} -> ${destinationPath}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error copying file: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Tree
  server.registerTool(
    "tree",
    {
      description: "Show the workspace folder structure.",
    },
    async () => {
      try {
        const tree = await getTree(workspaceRoot);

        return {
          content: [
            {
              type: "text",
              text: tree,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error generating tree: ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  return server;
}

if (process.env.MCP_TRANSPORT !== "http") {
  void serveStdio(createServer);
  console.error("Secure MCP File Server running on stdio");
}
