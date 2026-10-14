# MCP File Server

A custom Model Context Protocol (MCP) file server that provides controlled file operations inside a sandboxed workspace.

The server supports local MCP connections through **stdio** and an HTTP endpoint through **Streamable HTTP**. It provides dedicated tools for file operations while restricting requested paths to the configured workspace.

## Project Overview

This project is developed as part of the CS3A / CS3B Elective MCP project requirements.

**Technology stack:**
- Node.js 20 or later
- TypeScript
- Model Context Protocol (MCP)
- `@modelcontextprotocol/server`
- Zod
- HTTP and Streamable HTTP transport

## Features

- Sandboxed workspace for file operations
- Workspace path validation and symbolic-link checks
- 13 MCP tools
- Stdio transport for local MCP clients
- Streamable HTTP transport at `/mcp`
- Bearer-token authentication for HTTP requests
- 1 MB HTTP request-body limit
- TypeScript type checking
- Project-state and handoff documentation

## Available MCP Tools

| Tool | Description |
|---|---|
| `workspace_info` | Returns information about the configured workspace. |
| `list` | Lists files and directories. |
| `read` | Reads a file. |
| `write` | Creates or overwrites a file. |
| `append` | Appends content to a file. |
| `str_replace` | Replaces specified text in a file. |
| `delete` | Deletes a file. |
| `search` | Searches workspace files for text. |
| `move` | Moves or renames a file. |
| `mkdir` | Creates a directory. |
| `file_info` | Returns information about a file or directory. |
| `copy` | Copies a file. |
| `tree` | Displays the workspace directory structure. |

All file operations are intended to remain inside the configured workspace. Access outside that workspace should be rejected by the path-security checks.

## Requirements

Install the following before running the project:

- Node.js 20 or later
- npm
- Git

## Installation

Clone the repository:

    git clone https://github.com/dmhndsm/CS2_MCP-FILE-SERVER.git

Enter the project directory:

    cd CS2_MCP-FILE-SERVER

Install dependencies:

    npm install

## Running the Server

### Stdio transport

Start the local MCP server:

    npm run dev

This runs the TypeScript server through `tsx` and uses stdio for communication with a compatible MCP client.

### Streamable HTTP transport

The HTTP server requires an environment variable named `MCP_AUTH_TOKEN`. The token must contain at least 32 characters.

In PowerShell, set a token for local testing:

    $env:MCP_AUTH_TOKEN = "REPLACE-WITH-A-STRONG-RANDOM-SECRET-AT-LEAST-32-CHARACTERS"

Start the HTTP server:

    npm run dev:http

By default, the server listens at:

    http://127.0.0.1:3000/mcp

The default host is `127.0.0.1` and the default port is `3000`. The `HOST` and `PORT` environment variables can override these values.

HTTP requests must include the bearer token:

    Authorization: Bearer YOUR_MCP_AUTH_TOKEN

For example, a request must supply the same secret used to set `MCP_AUTH_TOKEN`. Requests without the correct token receive `401 Unauthorized`.

**Security:** The example token above is a placeholder. Generate a strong, random secret for actual use. Do not commit real tokens to Git. The default HTTP binding is for local testing; public deployment requires an appropriately secured HTTPS endpoint and additional deployment configuration.

## Configuration

| Variable | Purpose | Default |
|---|---|---|
| `MCP_AUTH_TOKEN` | Required bearer token for HTTP transport; must be at least 32 characters | No default |
| `HOST` | HTTP listening interface | `127.0.0.1` |
| `PORT` | HTTP listening port | `3000` |
| `WORKSPACE_ROOT` | Optional workspace directory override | Defined by the server's path-resolution logic |

The exact workspace path depends on the server configuration. Use a dedicated workspace directory and verify its resolved location before performing file operations.

## Testing and Type Checking

Run the TypeScript check:

    npx tsc --noEmit

A successful check produces no TypeScript errors.

The project has been tested during development using MCP Inspector and direct HTTP requests. Reported tests include tool discovery, workspace information, file operations, path-traversal rejection for several tools, HTTP startup, authentication rejection, and successful MCP initialization and tool listing.

The HTTP request-body limit is 1 MB. Verify that oversized requests return `413 Payload Too Large` before relying on this behavior in deployment.

These development tests do not establish that every tool, attack scenario, or production deployment has been fully tested.

## Security Considerations

- File operations use workspace path validation.
- Paths that attempt to escape the workspace are intended to be rejected.
- Symbolic-link checks are implemented, but they do not guarantee protection against every possible filesystem race condition.
- HTTP access requires bearer-token authentication.
- HTTP request bodies are limited to 1 MB.
- Use HTTPS for remote connections.
- Do not expose the local development server directly to the public internet without appropriate security and deployment configuration.
- Use a dedicated workspace and avoid storing sensitive files inside it.
- Review destructive operations such as `delete` before production use.

## Project Structure

    mcp-file-server/
    ├── src/
    │   ├── server.ts
    │   ├── httpServer.ts
    │   ├── tools/
    │   └── utils/
    │       └── pathSecurity.ts
    ├── workspace/
    ├── manifest.json
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    └── README.md

The actual directory contents may include additional files, including handoff documentation and generated build output.

## Handoff Documentation

The project uses the following files to record its state and decisions:

- `workspace/PROJECT_STATE.md`
- `workspace/PLAN_LOG.md`
- `workspace/CHECKPOINTS.md`
- `workspace/DECISIONS.md`

These files should be kept consistent with the current implementation and project progress.

## Development Status

### Implemented

- MCP server with 13 tools
- Workspace sandbox and path validation
- Stdio transport
- Streamable HTTP transport
- HTTP bearer-token authentication
- HTTP request-body size limit
- Git and GitHub version control
- Initial project documentation

### Remaining verification and deployment work

- Confirm the oversized-request test returns HTTP 413
- Complete the final security review
- Review workspace configuration for portability
- Configure and verify HTTPS deployment if required
- Configure process management and restart behavior if required
- Test a realistic multi-step workflow using a real MCP client
- Complete any additional deliverables still required by the latest course rubric

## GitHub Repository

Repository:

https://github.com/dmhndsm/CS2_MCP-FILE-SERVER

The repository is currently private during development.

## License

This project is currently provided for academic and educational purposes.