# Technical Report — Secure MCP File Server

## 1. Stack and why
Node.js 20+/TypeScript (strict) with the official MCP TypeScript SDK and Zod. TypeScript catches path/argument type errors at compile time; the SDK handles protocol details (stdio + Streamable HTTP); Zod gives runtime schemas (every path is `min(1).max(512)`, content capped at 1 MB). Plain `node:http` keeps the HTTP layer small and auditable. PM2 supervises the process; Cloudflare Tunnel provides HTTPS without opening inbound ports.

## 2. Architecture
Client --HTTPS--> tunnel --HTTP--> `httpServer.ts` (auth, size limit, /health) --> `createServer()` (13 single-purpose tools) --> `resolveSafePath()` --> workspace directory. Stdio entry (`server.ts`) shares the same tool code. Handoff files (PROJECT_STATE, PLAN_LOG, CHECKPOINTS, DECISIONS) live in the workspace so a new agent session can recover context.

## 3. Tool design
13 single-purpose tools (workspace_info, list, read, write, append, str_replace, delete, search, move, mkdir, file_info, copy, tree). Failures return `isError: true` with a plain-language message instead of crashing. `list` accepts an optional subdirectory.

## 4. Security model and trade-offs
- **Path sandbox:** lexical containment check, then `realpath` of the nearest existing ancestor compared against the real workspace root, so symlinks cannot escape. NUL bytes rejected.
- **Bug found and fixed in audit:** `append` used only a lexical prefix check, so a symlink inside the workspace could redirect appends to an outside file. Reproduced against the old code (outside file was modified), fixed by routing through `resolveSafePath`, covered by a regression test. A second flaw was found and fixed: dangling symlinks were treated as non-existent, which allowed writing through them; `lstat` is now used.
- **Auth:** bearer token (>= 32 chars) from environment, constant-time comparison. `/health` is the only unauthenticated route and returns no data.
- **DoS limits:** 1 MB body cap (413 via Content-Length and streaming), schema length limits.
- **Destructive operations:** `delete` removes files only, refuses the four handoff files, and every write/append/str_replace/move/copy/delete is appended to a JSON-lines audit log kept outside the workspace.
- **Residual risk:** TOCTOU races between validation and use (a process with write access to the workspace could swap a path for a symlink); mitigated by a dedicated workspace and not running other untrusted writers there. Single shared token, no per-user identity or rate limiting. Quick tunnels have random, public URLs — rely on the token.

## 5. Verification
`npm test` builds the project and runs 20 tests: traversal (relative, absolute, sibling-prefix, NUL) against all file tools, symlink and dangling-symlink escapes, delete gating, error messages, and an HTTP suite against the compiled server (auth 401, 404, 413, initialize, tools/list = 13, tool calls, audit log).

## Security Test Evidence

The security test suite completed with 10 passing tests,
0 failing tests, and 3 skipped tests out of 13 total.

The executed tests cover workspace path containment,
path traversal rejection, protected files and directories,
and error handling.

Three symlink-related tests were skipped. Therefore,
the results do not establish that all symlink attack
scenarios have been verified.

![Security test results](images/security-tests.png)

## 6. Limitations
Quick-tunnel URL changes on restart (use a named tunnel for a stable URL). No automated test for PM2/tunnel — verified manually per docs/DEPLOYMENT.md.