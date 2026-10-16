# Decisions

## Project
MCP File Server

### 1. Node.js and TypeScript
**Decision:** Use Node.js and TypeScript.

**Reason:** TypeScript provides static checking and works with the MCP TypeScript SDK.

**Status:** Implemented.

### 2. MCP TypeScript Server SDK
**Decision:** Use `@modelcontextprotocol/server` to expose tools through MCP.

**Reason:** The SDK handles MCP protocol integration.

**Status:** Implemented.

### 3. Zod Input Validation
**Decision:** Validate tool inputs with Zod schemas.

**Reason:** Runtime validation helps reject malformed arguments before filesystem operations.

**Status:** Implemented.

### 4. Workspace Sandbox
**Decision:** Resolve file paths against a configured workspace and reject paths that escape it.

**Reason:** The server should not provide arbitrary filesystem access.

**Status:** Implemented in source. Continue running regression tests and recognize residual filesystem race risks.

### 5. Configurable Workspace
**Decision:** Support `WORKSPACE_ROOT` and a configured default workspace resolution.

**Reason:** Avoid tying the project to one machine's absolute path.

**Status:** Implemented.

### 6. Stdio and Streamable HTTP Transports
**Decision:** Provide stdio for local MCP clients and Streamable HTTP for HTTP-based clients.

**Reason:** Supports local development and optional remote connection.

**Status:** Implemented. Treat remote deployment as verified only after testing it on the host.

### 7. Single-Purpose Tools
**Decision:** Expose separate tools for reading, writing, appending, replacing, searching, copying, moving, deleting, and inspecting files and directories.

**Reason:** Focused operations are easier to describe, validate, and test.

**Status:** 13 tools are registered in the server source.

### 8. Git Version Control
**Decision:** Maintain the project in Git and use the project GitHub repository.

**Reason:** Version history supports change tracking and recovery.

**Status:** Repository URL is documented in the README. Verify repository access and visibility before submission.

### 9. Handoff Protocol Files
**Decision:** Maintain `PROJECT_STATE.md`, `PLAN_LOG.md`, `CHECKPOINTS.md`, and `DECISIONS.md`.

**Reason:** Preserve state, progress, milestones, and design rationale across work sessions.

**Status:** The four files exist. Update them together when implementation or verification status changes.

### 10. Testing Before Finalization
**Decision:** Run type checking and automated tests before submission.

**Reason:** Documentation should reflect the behavior of the submitted version.

**Status:** Run `npx tsc --noEmit` and `npm test` against the final version. Use `npm run typecheck` only if that script exists in `package.json`.

### 11. Bearer-Token Authentication
**Decision:** Require `MCP_AUTH_TOKEN` for HTTP MCP requests.

**Reason:** Reduce unauthorized access to file operations.

**Status:** Implemented. Use a strong secret and never commit it.

### 12. Request-Body Limit
**Decision:** Limit HTTP request body size.

**Reason:** Reduce the risk of excessive memory use from oversized requests.

**Status:** Implemented in source. Use the current automated test output to confirm exact behavior on the submitted version.

### 13. Shared Path Validation
**Decision:** Route file operations through the shared path-safety helper, including append operations, and check existing ancestors and symbolic-link targets.

**Reason:** A lexical prefix check alone can allow a symbolic link to redirect a write outside the workspace.

**Status:** Implemented in source. Regression tests are included; confirm their current results before submission.

### 14. Audit Log and Guarded Delete
**Decision:** Record mutating operations in a JSON-lines audit log when enabled, and prevent `delete` from removing the four handoff files.

**Reason:** Improve traceability and protect project handoff state.

**Status:** Implemented in source. Verify configuration and test results for the submitted version.

### 15. PM2 and HTTPS Tunnel
**Decision:** Document PM2 supervision and Cloudflare Tunnel as a remote deployment option.

**Reason:** Expose a local HTTP service through HTTPS without opening an inbound application port directly.

**Status:** Configuration and instructions exist. Do not claim restart behavior or public endpoint status unless manually verified on the host.

### 16. Separate Stdio and HTTP Entry Points
**Decision:** Keep stdio and HTTP startup paths separate while sharing MCP tool registration.

**Reason:** Importing the shared server implementation from the HTTP entry point should not inadvertently start stdio transport.

**Status:** Implemented in source.

## Documentation Policy
The professor clarified that a live demo is not required as a submission deliverable. Documentation should prioritize reproducible setup, accurate implementation details, test instructions, architecture, and security trade-offs. Optional demo documents are not evidence of completion unless they contain actual recorded results.

## Last Updated
2026-10-17
