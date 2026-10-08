# MCP File Server

A Model Context Protocol (MCP) file server that provides controlled file operations inside a sandboxed workspace.

This project allows an MCP-compatible client to interact with files through dedicated MCP tools instead of giving the client unrestricted access to the computer's filesystem.

## Project Purpose

The purpose of this project is to build and demonstrate a custom MCP file-server connector with a sandboxed workspace and controlled file operations.

The server is built with Node.js, TypeScript, and the official MCP TypeScript SDK.

## Current MCP Tools

The server currently provides the following tools:

| Tool | Description |
|---|---|
| `workspace_info` | Returns information about the configured workspace. |
| `list` | Lists files and directories in the workspace. |
| `read` | Reads the contents of a file in the workspace. |
| `write` | Creates a new file or overwrites an existing file in the workspace. |
| `append` | Adds content to an existing file in the workspace. |

All file paths are resolved against the configured workspace root.

## Requirements

Before running the server, make sure the following are installed:

- Node.js 20 or later
- npm
- Git

## Installation

Clone the repository:

```bash
git clone https://github.com/dmhndsm/CS2_MCP-FILE-SERVER.git
```

Enter the project directory:

```bash
cd CS2_MCP-FILE-SERVER
```

Install the project dependencies:

```bash
npm install
```

## Running the Server

Start the MCP file server with:

```bash
npm run dev
```

The server runs the TypeScript source through `tsx`.

The current development configuration uses the MCP stdio transport for local MCP client connections.

## Project Structure

```text
mcp-file-server/
├── src/
│   ├── server.ts
│   ├── tools/
│   │   ├── append.ts
│   │   ├── list.ts
│   │   ├── read.ts
│   │   └── write.ts
│   └── utils/
│       └── pathSecurity.ts
├── dist/
├── workspace/
├── manifest.json
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

### Source Code

- `src/server.ts` — Initializes the MCP server and registers the available tools.
- `src/tools/` — Contains the implementations of the file-operation tools.
- `src/utils/pathSecurity.ts` — Handles workspace path validation and prevents paths from escaping the sandboxed workspace.
- `dist/` — Contains the compiled JavaScript files.
- `workspace/` — The sandboxed directory where file operations are performed.
- `manifest.json` — Contains the MCP package configuration.
- `package.json` — Defines the project dependencies and npm scripts.

## Sandboxed Workspace

The server is designed to restrict file operations to the configured workspace directory.

File paths are resolved against the workspace root before file operations are performed. Paths that attempt to escape the workspace are rejected.

This helps prevent path traversal attempts such as:

```text
../../outside-file.txt
```

from accessing files outside the permitted workspace.

The `workspace/` directory is used as the controlled area for the file operations provided by the MCP server.

## File Operations

### List

The `list` tool displays files and directories available in the workspace.

Example:

```text
list
```

### Read

The `read` tool reads the contents of a file inside the workspace.

Example:

```text
read("hello.txt")
```

### Write

The `write` tool creates a new file or replaces the contents of an existing file.

Example:

```text
write("example.txt", "Hello from MCP")
```

### Append

The `append` tool adds content to an existing file without replacing its current contents.

Example:

```text
append("example.txt", "\nAdditional content")
```

### Workspace Information

The `workspace_info` tool provides information about the configured workspace.

## Security

The server uses a workspace sandbox to restrict file operations.

The path-security utility validates requested paths before they are used for file operations. This is intended to prevent path traversal and unauthorized access to files outside the configured workspace.

The server should be used with a controlled workspace and should not be treated as unrestricted access to the host filesystem.

## Dependencies

The project uses the following main dependencies:

- `@modelcontextprotocol/server` — MCP server functionality.
- `zod` — Schema validation for tool inputs.
- `tsx` — Runs the TypeScript server directly during development.
- `typescript` — TypeScript development tooling.
- `@types/node` — Node.js type definitions.

## Configuration

The MCP server currently uses a configured workspace root for file operations.

The workspace configuration should be reviewed before deploying the server to another computer because the current development configuration may contain a machine-specific path.

For deployment or distribution, the workspace path should be configured in a portable manner rather than relying on a user-specific absolute path.

## MCP Package

The project contains an MCP package manifest used for packaging the server as an MCP bundle.

The generated `.mcpb` package is intentionally excluded from Git through `.gitignore` while development is ongoing.

The package can be generated or distributed separately when the server configuration and implementation are finalized.

## Development Status

This project is currently under development.

The current implementation provides:

- A working MCP server.
- A sandboxed workspace.
- Path validation.
- Core file-operation tools.
- MCP client testing.
- Local stdio-based communication.

Additional requirements from the project specification will be implemented during development.

These include:

- At least eight MCP tools.
- Additional file operations such as `str_replace` and `delete`.
- Git-lite or search functionality.
- Handoff files including `PROJECT_STATE`, `PLAN_LOG`, `CHECKPOINTS`, and `DECISIONS`.
- HTTPS deployment through a tunnel.
- Process management.
- Security testing.
- Multi-agent testing across multiple sessions.
- A documented multi-step demonstration task.

## Project Goals

The completed project is intended to provide:

- A working custom MCP file server.
- A sandboxed workspace.
- At least eight MCP tools.
- Controlled file operations.
- Path traversal protection.
- Handoff and project-state files for multi-agent work.
- Git-related or search functionality.
- HTTPS deployment through a tunnel.
- Process management for persistent operation.
- Testing with an MCP client.
- A documented multi-step task involving multiple agent sessions.

## Academic Project

This project is developed as part of the CS3A / CS3B Elective MCP project requirements.

The project follows the Week 6 MCP project requirements, including the development of a custom MCP file server, sandboxing, tool implementation, deployment, handoff protocol, testing, documentation, and demonstration.

## License

This project is currently provided for academic and educational purposes.