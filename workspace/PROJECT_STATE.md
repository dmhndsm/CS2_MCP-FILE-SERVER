# Project State

## Project
MCP File Server

## Overview
A sandboxed Model Context Protocol (MCP) file server built with Node.js, TypeScript, the MCP TypeScript server SDK, and Zod. It provides controlled file operations inside a configured workspace using stdio and Streamable HTTP transports.

## Technology stack
- Node.js 20 or later, compatible with the project dependencies
- TypeScript
- `@modelcontextprotocol/server`
- Zod
- `tsx` for development execution
- Node.js HTTP server for Streamable HTTP
- PM2 configuration for process supervision
- Cloudflare Tunnel documented as an HTTPS exposure option

## Implemented tools
1. `workspace_info` — reports workspace information.
2. `list` — lists files and directories.
3. `read` — reads file contents.
4. `write` — creates or overwrites files.
5. `append` — appends content.
6. `str_replace` — replaces specified text.
7. `delete` — deletes eligible files subject to safeguards.
8. `search` — searches workspace files for text.
9. `move` — moves or renames supported items.
10. `mkdir` — creates directories.
11. `file_info` — retrieves file/directory information.
12. `copy` — copies supported items.
13. `tree` — displays the workspace directory tree.

## Transports
### Stdio
Implemented in `src/server.ts`; development command: `npm run dev`.

### Streamable HTTP
Implemented in `src/httpServer.ts`; development command: `npm run dev:http`. Default endpoint: `http://127.0.0.1:3000/mcp`. Requires `MCP_AUTH_TOKEN` with at least 32 characters. `HOST` and `PORT` can override the default bind address and port. `/health` is provided for liveness checks.

## Security controls implemented in code
- Shared workspace path validation, including checks for symbolic-link escapes and dangling symlinks.
- Zod input validation and bounded input lengths.
- HTTP bearer-token authentication.
- HTTP request-body size limit.
- Audit logging for mutating operations when enabled.
- `delete` safeguards for the four handoff files.

## Verification status
The project includes automated security and HTTP tests in `test/`, and `npm test` builds the project before running them. A previous project update recorded 20 passing tests. Re-run `npm test` and `npm run typecheck` on the exact version being submitted; current command output is the authoritative result.

Deployment-related items such as PM2 restart behavior and the public HTTPS tunnel must be described as verified only if they have been tested on the host machine. Likewise, record real-client and multi-session checks only when they have actually been performed.

## Handoff documents
- `workspace/PROJECT_STATE.md`
- `workspace/PLAN_LOG.md`
- `workspace/CHECKPOINTS.md`
- `workspace/DECISIONS.md`

These files should be updated together when implementation or verification status changes.

## Submission documentation focus
The professor clarified that a live demo is not required for the submission. The documentation focus is a working repository, a README that a classmate can follow, and supporting project documentation. Optional deployment/testing guides may remain in the repository but should not be represented as proof that a test was run.

## Last updated
2026-10-17
