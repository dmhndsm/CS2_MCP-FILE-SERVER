# MCP File Server

A Model Context Protocol (MCP) file server that provides controlled file operations inside a sandboxed workspace.

This project allows an MCP-compatible client to interact with files through dedicated MCP tools instead of giving the client unrestricted access to the computer's filesystem.

## Project Purpose

The purpose of this project is to build and demonstrate a custom MCP file-server connector with a sandboxed workspace and controlled file operations.

The server is built with Node.js, TypeScript, the MCP TypeScript SDK, and Zod for input validation.

## Current MCP Tools

The server currently provides the following 13 tools:

| Tool | Description |
|---|---|
| `workspace_info` | Returns information about the configured workspace. |
| `list` | Lists files and directories in the workspace. |
| `read` | Reads the contents of a file in the workspace. |
| `write` | Creates a new file or overwrites an existing file in the workspace. |
| `append` | Adds content to an existing file in the workspace. |
| `str_replace` | Replaces specific text inside a file. |
| `delete` | Deletes a file inside the workspace. |
| `search` | Searches workspace files for specific text. |
| `move` | Moves or renames a file inside the workspace. |
| `mkdir` | Creates a directory inside the workspace. |
| `file_info` | Returns information about a file or directory. |
| `copy` | Copies a file inside the workspace. |
| `tree` | Displays the folder structure of the workspace. |

All file paths are resolved against the configured workspace root.

## Requirements

Before running the server, make sure the following are installed:

- Node.js 20 or later
- npm
- Git

## Installation

Clone the repository:

    git clone https://github.com/dmhndsm/CS2_MCP-FILE-SERVER.git

Enter the project directory:

    cd CS2_MCP-FILE-SERVER

Install the project dependencies:

    npm install

## Running the Server

Start the MCP file server with:

    npm run dev

The server runs the TypeScript source through `tsx`.

The current development configuration uses the MCP stdio transport for local MCP client connections.

HTTPS deployment and Streamable HTTP transport are planned for the deployment phase of the project.

## Project Structure

    mcp-file-server/
    ├── src/
    │   ├── server.ts
    │   ├── tools/
    │   │   ├── append.ts
    │   │   ├── copy.ts
    │   │   ├── delete.ts
    │   │   ├── file_info.ts
    │   │   ├── list.ts
    │   │   ├── mkdir.ts
    │   │   ├── move.ts
    │   │   ├── read.ts
    │   │   ├── search.ts
    │   │   ├── str_replace.ts
    │   │   ├── tree.ts
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

### Source Code

- `src/server.ts` — Initializes the MCP server and registers the available tools.
- `src/tools/` — Contains the implementations of the MCP file-operation tools.
- `src/utils/pathSecurity.ts` — Handles workspace path validation and prevents paths from escaping the sandboxed workspace.
- `dist/` — Contains compiled JavaScript files.
- `workspace/` — The sandboxed directory where file operations are performed.
- `manifest.json` — Contains the MCP package configuration.
- `package.json` — Defines the project dependencies and npm scripts.

## Sandboxed Workspace

The server is designed to restrict file operations to the configured workspace directory.

File paths are resolved against the workspace root before file operations are performed. Paths that attempt to escape the workspace are rejected.

This helps prevent path traversal attempts such as:

    ../../outside-file.txt

from accessing files outside the permitted workspace.

The `workspace/` directory is used as the controlled area for file operations provided by the MCP server.

Formal security and path-traversal testing will be completed as part of the security phase of the project.

## File Operations

### List

The `list` tool displays files and directories available in the workspace.

Example:

    list

### Read

The `read` tool reads the contents of a file inside the workspace.

Example:

    read("hello.txt")

### Write

The `write` tool creates a new file or replaces the contents of an existing file.

Example:

    write("example.txt", "Hello from MCP")

### Append

The `append` tool adds content to an existing file without replacing its current contents.

Example:

    append("example.txt", "\nAdditional content")

### String Replace

The `str_replace` tool replaces a specific piece of text inside a file.

Example:

    str_replace("example.txt", "old text", "new text")

### Delete

The `delete` tool removes a file from the workspace.

Example:

    delete("example.txt")

### Search

The `search` tool searches workspace files for specific text.

Example:

    search("MCP")

### Move

The `move` tool moves or renames a file inside the workspace.

Example:

    move("old-name.txt", "new-name.txt")

### Make Directory

The `mkdir` tool creates a directory inside the workspace.

Example:

    mkdir("test-folder")

### File Information

The `file_info` tool provides information about a file or directory, including its name, size, type, and modification time.

Example:

    file_info("example.txt")

### Copy

The `copy` tool creates a copy of a file inside the workspace.

Example:

    copy("example.txt", "example-copy.txt")

### Tree

The `tree` tool displays the folder structure of the workspace.

Example:

    tree

### Workspace Information

The `workspace_info` tool provides information about the configured workspace.

## Security

The server uses a workspace sandbox to restrict file operations.

The path-security utility validates requested paths before they are used for file operations. This is intended to prevent path traversal and unauthorized access to files outside the configured workspace.

The server should be used with a controlled workspace and should not be treated as unrestricted access to the host filesystem.

Additional security testing will be performed before public deployment, including path-traversal testing and checks that the sandbox cannot be bypassed.

Destructive operations such as `delete` will also be reviewed for appropriate safeguards or logging during the security phase.

## Dependencies

The project uses the following main dependencies:

- `@modelcontextprotocol/server` — MCP server functionality.
- `zod` — Schema validation for tool inputs.
- `tsx` — Runs the TypeScript server directly during development.
- `typescript` — TypeScript development tooling.
- `@types/node` — Node.js type definitions.

## Configuration

The MCP server currently uses a configured workspace root for file operations.

The current development configuration contains a machine-specific workspace path. This is acceptable for the current local development setup but should be changed to a portable configuration before deployment.

For deployment or distribution, the workspace path should be configured through an appropriate environment variable or configuration method rather than relying on a user-specific absolute path.

## MCP Package

The project contains an MCP package manifest used for packaging the server as an MCP bundle.

The generated `.mcpb` package is intentionally excluded from Git through `.gitignore` while development is ongoing.

The package can be generated or distributed separately when the server configuration and implementation are finalized.

## Testing Status

The MCP server and its tools have been tested during development using MCP Inspector.

The following tools have been tested during development:

- `workspace_info`
- `list`
- `read`
- `write`
- `append`
- `str_replace`
- `delete`
- `search`
- `move`
- `mkdir`
- `file_info`
- `copy`
- `tree`

Temporary test files were removed after testing so that the workspace can remain clean.

Testing with a real MCP client and the final deployed server will be completed during the deployment and demonstration phase.

## GitHub Repository

The project is maintained in a GitHub repository:

    https://github.com/dmhndsm/CS2_MCP-FILE-SERVER.git

The repository uses Git for version control and contains the project source code, configuration files, documentation, and project history.

The repository is currently private during development.

## Development Status

The project is currently under development.

### Completed

- Working MCP server
- Sandboxed workspace
- Workspace path validation
- 13 MCP tools
- File operation tools
- Search functionality
- MCP Inspector testing
- Git version control
- GitHub repository
- Initial project documentation
- Clean workspace with `.gitkeep`

### Remaining

- Formal path-traversal and security testing
- Portable workspace configuration
- Streamable HTTP transport
- HTTPS deployment through a tunnel
- Process manager configuration
- Handoff protocol
- `PROJECT_STATE`
- `PLAN_LOG`
- `CHECKPOINTS`
- `DECISIONS`
- Real MCP client connection
- Multi-step task across 2 or more sessions
- Final security review
- Short technical report
- Tool-call transcript
- Final README review
- 5-minute live demonstration

## Project Goals

The completed project is intended to provide:

- A working custom MCP file server.
- A sandboxed workspace.
- At least eight MCP tools.
- Controlled file operations.
- Path traversal protection.
- Handoff and project-state files for multi-agent work.
- Search or git-related functionality.
- HTTPS deployment through a tunnel.
- Process management for persistent operation.
- Testing with a real MCP client.
- A documented multi-step task involving multiple agent sessions.

## Academic Project

This project is developed as part of the CS3A / CS3B Elective MCP project requirements.

The project follows the Week 6 MCP project requirements, including the development of a custom MCP file server, sandboxing, tool implementation, deployment, handoff protocol, testing, documentation, and demonstration.

## License

This project is currently provided for academic and educational purposes.