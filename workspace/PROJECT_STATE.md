# Project State

## Project Name
MCP File Server

## Overview
A sandboxed file server built with Node.js, TypeScript, and the Model Context Protocol (MCP). It provides tools for managing and inspecting files within a designated workspace.

## Technology Stack
- Node.js
- TypeScript
- MCP TypeScript SDK
- Zod
- `tsx` for development

## Implemented Tools
1. `workspace_info` — reports the workspace directory.
2. `list` — lists workspace files.
3. `read` — reads file contents.
4. `write` — writes file contents.
5. `append` — appends content to files.
6. `str_replace` — replaces text in files.
7. `delete` — deletes files.
8. `search` — searches for text inside workspace files.
9. `move` — moves files.
10. `mkdir` — creates directories.
11. `file_info` — retrieves file information.
12. `copy` — copies files.
13. `tree` — displays the workspace directory tree.

## Security Status
- Workspace path resolution is implemented.
- Manual path traversal checks were performed using MCP Inspector.
- The tested outside-workspace paths were rejected by the applicable tools.
- Symbolic-link escape protection has not yet been verified.
- Formal automated security tests are still pending.

## Current Configuration
- The server currently uses standard input/output (stdio) transport.
- The workspace path can be configured using the `WORKSPACE_ROOT` environment variable.
- If `WORKSPACE_ROOT` is not set, the server resolves the `workspace` directory relative to the project.

## Remaining Work
- Review symbolic-link and path traversal security.
- Add formal security tests.
- Complete the remaining handoff protocol files.
- Configure Streamable HTTP transport.
- Set up an HTTPS tunnel and process manager.
- Test the server with a real MCP client.
- Verify multi-step work across multiple sessions.
- Finalize the README and supporting documentation.

## Last Updated
2026-10-13
