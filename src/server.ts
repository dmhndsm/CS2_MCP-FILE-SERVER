import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";
import path from "node:path";

import { listFiles } from "./tools/list.js";
import { readFile } from "./tools/read.js";
import { writeFile } from "./tools/write.js";
import { appendFile } from "./tools/append.js";

// Your actual workspace folder
const workspaceRoot =
  "C:/Users/cangu/Documents/JR FILES/GIT/3RD YR/CSPROF2/mcp-file-server/workspace";

function createServer() {
  const server = new McpServer({
    name: "secure-mcp-file-server",
    version: "1.0.0",
  });

  // Workspace information
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
    }
  );

  // Read a file
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
    }
  );

  // List files
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
                files.length > 0
                  ? files.join("\n")
                  : "The workspace is empty.",
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
    }
  );

  // Write a file
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
    }
  );

  // Append to a file
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
    }
  );

  return server;
}

void serveStdio(createServer);

console.error("Secure MCP File Server running on stdio");