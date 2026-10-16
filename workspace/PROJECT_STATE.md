# Project State

## Project
MCP File Server

## Overview
A sandboxed Model Context Protocol (MCP) file server built with Node.js, TypeScript, the MCP TypeScript server SDK, and Zod. It provides controlled file operations inside a configured workspace using stdio and Streamable HTTP transports.

## Technology Stack
- Node.js 20 or later, compatible with the project dependencies
- TypeScript
- `@modelcontextprotocol/server`
- Zod
- `tsx` for development execution
- Node.js HTTP server for Streamable HTTP
- PM2 configuration for process supervision
- Cloudflare Tunnel documented as an HTTPS exposure option

## Implemented Tools
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
Implemented in `src/server.ts`. Development command: `npm run dev`.

### Streamable HTTP
Implemented in `src/httpServer.ts`. Development command: `npm run dev:http`.

Default endpoint: `http://127.0.0.1:3000/mcp`.

The HTTP server requires `MCP_AUTH_TOKEN` with at least 32 characters. `HOST` and `PORT` can override the default bind address and port. The `/health` endpoint is provided for liveness checks.

## Security Controls Implemented in Code
- Shared workspace path validation, including symbolic-link escape checks.
- Handling for dangling symbolic links.
- Zod input validation and bounded input lengths.
- HTTP bearer-token authentication.
- HTTP request-body size limit.
- Audit logging for mutating operations when enabled.
- `delete` safeguards for the four handoff files.

These describe implemented controls; their effectiveness should be supported by the applicable automated tests and deployment checks.

## Verification Status
Previously recorded test results:
- Full test suite: 17 passed, 0 failed, 3 skipped.
- Security test suite: 10 passed, 0 failed, 3 skipped.

These are historical results, not a claim that the current working tree has been retested. Rerun `npm test` and `npx tsc --noEmit` against the exact version being submitted, then update this section using the actual output. Investigate the three skipped tests before claiming complete security-test coverage.

PM2 restart behavior, public HTTPS tunnel access, real MCP-client connectivity, and multi-session handoff behavior should be described as verified only if they have actually been tested.

## Handoff Documents
- `workspace/PROJECT_STATE.md`
- `workspace/PLAN_LOG.md`
- `workspace/CHECKPOINTS.md`
- `workspace/DECISIONS.md`

Update these files together whenever implementation progress, decisions, or verification status changes.

## Submission Documentation Focus
The professor clarified that a live demo is not required for this submission. Documentation should focus on a working repository, a README that another student can follow, and supporting project documentation. Deployment and testing guides may remain in the repository, but instructions or screenshots must not be presented as proof of checks that were never performed.

## Last Updated
2026-10-17
