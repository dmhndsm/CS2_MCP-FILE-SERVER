# Project State

## Project Name
MCP File Server

## Overview
A sandboxed file server built with Node.js, TypeScript, the Model Context Protocol (MCP), and Zod. It provides controlled file operations inside a designated workspace through stdio and Streamable HTTP transports.

## Technology Stack
- Node.js 20 or later
- TypeScript
- `@modelcontextprotocol/server`
- Zod
- `tsx`
- Node.js HTTP server

## Implemented Tools
1. `workspace_info` — reports workspace information.
2. `list` — lists workspace files and directories.
3. `read` — reads file contents.
4. `write` — creates or overwrites files.
5. `append` — appends content to files.
6. `str_replace` — replaces text in files.
7. `delete` — deletes files.
8. `search` — searches workspace files.
9. `move` — moves or renames files.
10. `mkdir` — creates directories.
11. `file_info` — retrieves file information.
12. `copy` — copies files.
13. `tree` — displays the workspace directory tree.

## Transport Status

### Stdio
- Implemented in `src/server.ts`.
- Started with `npm run dev`.
- Intended for local MCP client connections.

### Streamable HTTP
- Implemented in `src/httpServer.ts`.
- Started with `npm run dev:http`.
- Default endpoint: `http://127.0.0.1:3000/mcp`.
- Requires the `MCP_AUTH_TOKEN` environment variable.
- Rejects missing or incorrect bearer tokens.
- Enforces a 1 MB request-body limit.
- Defaults to listening on `127.0.0.1`, port `3000`.

## Configuration
- `MCP_AUTH_TOKEN` — required for HTTP transport and must contain at least 32 characters.
- `HOST` — optional HTTP listening host; defaults to `127.0.0.1`.
- `PORT` — optional HTTP listening port; defaults to `3000`.
- `WORKSPACE_ROOT` — optional workspace directory override.

If `WORKSPACE_ROOT` is not set, the server uses its configured default workspace resolution.

## Security Status
- Workspace path resolution and validation are implemented.
- Manual path-traversal checks were performed using MCP Inspector.
- Several tested outside-workspace paths were rejected.
- Symbolic-link escape checks were attempted during development.
- Formal automated security tests remain pending.
- HTTP bearer-token authentication has been tested for missing, incorrect, and correct tokens.
- The request-size limit has been implemented; the exact HTTP 413 response should be confirmed.
- Public deployment and production security review remain incomplete.

## Handoff Documentation
The following files exist and are tracked by Git:
- `workspace/PROJECT_STATE.md`
- `workspace/PLAN_LOG.md`
- `workspace/CHECKPOINTS.md`
- `workspace/DECISIONS.md`

Their contents should continue to reflect the current implementation and verified progress.

## Testing Status
- MCP tools were tested during development using MCP Inspector.
- TypeScript checks using `npx tsc --noEmit` have passed during recent changes.
- HTTP server startup has been tested.
- Missing and incorrect bearer tokens were rejected.
- A valid initialization request succeeded.
- An MCP `tools/list` request succeeded.
- An oversized request was tested, but the exact HTTP 413 status still needs confirmation.

Testing with a real MCP client across multiple sessions remains to be verified.

## Remaining Work
- Confirm the HTTP 413 response for oversized requests.
- Review and finalize the README.
- Review the other handoff files for accuracy.
- Complete the required security review and any essential regression checks.
- Verify portable workspace configuration.
- Configure HTTPS deployment and process management if required by the final rubric.
- Test a realistic multi-step workflow with a real MCP client across multiple sessions.
- Confirm all required academic deliverables against the latest instructions.

## Last Updated
2026-10-15

## Update (audit follow-up)
Code-level gaps from the audit are closed: `append` sandbox fix, dangling-symlink fix, audit log, gated delete, stricter schemas, `/health`, PM2 config, build/test scripts, 20 passing tests. Still to do on the host: run PM2 + tunnel, real-client connection, two-session demo + transcript, clean-clone test. See docs/DEPLOYMENT.md and docs/DEMO_SCRIPT.md.
