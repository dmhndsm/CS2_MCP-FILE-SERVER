# Decisions

## Project
MCP File Server

### 1. Node.js and TypeScript
**Decision:** Use Node.js and TypeScript.  
**Reason:** TypeScript provides static checking and works with the MCP TypeScript SDK.  
**Status:** Implemented.

### 2. Official MCP TypeScript server SDK
**Decision:** Use `@modelcontextprotocol/server` to expose tools through MCP.  
**Reason:** The SDK handles MCP protocol integration.  
**Status:** Implemented.

### 3. Zod input validation
**Decision:** Validate tool inputs with Zod schemas.  
**Reason:** Runtime validation helps reject malformed arguments before filesystem operations.  
**Status:** Implemented.

### 4. Workspace sandbox
**Decision:** Resolve file paths against a configured workspace and reject paths that escape it.  
**Reason:** The server should not provide arbitrary filesystem access.  
**Status:** Implemented; continue to run regression tests and recognize residual filesystem race risks.

### 5. Configurable workspace
**Decision:** Support `WORKSPACE_ROOT` and a configured default workspace resolution.  
**Reason:** Avoid tying the project to one machine's absolute path.  
**Status:** Implemented.

### 6. Stdio and Streamable HTTP transports
**Decision:** Provide stdio for local MCP clients and Streamable HTTP for HTTP-based clients.  
**Reason:** Supports local development and optional remote connection.  
**Status:** Implemented. Treat remote deployment as verified only after testing it on the host.

### 7. Single-purpose tools
**Decision:** Expose separate tools for reading, writing, appending, replacing, searching, copying, moving, deleting, and inspecting files/directories.  
**Reason:** Focused operations are easier to describe, validate, and test.  
**Status:** 13 tools are registered.

### 8. Git version control
**Decision:** Maintain the project in Git and use the project GitHub repository.  
**Reason:** Version history supports change tracking and recovery.  
**Status:** Repository URL is documented in the README; verify its access and visibility before submission.

### 9. Handoff protocol files
**Decision:** Maintain `PROJECT_STATE.md`, `PLAN_LOG.md`, `CHECKPOINTS.md`, and `DECISIONS.md`.  
**Reason:** Preserve state, progress, milestones, and design rationale across work sessions.  
**Status:** Files exist; update them together when verification status changes.

### 10. Test before finalizing
**Decision:** Run type checking and automated tests before submission.  
**Reason:** Documentation should reflect the behavior of the submitted version.  
**Status:** Commands are available as `npm run typecheck` and `npm test`; rerun them on the final version.

### 11. Bearer-token authentication
**Decision:** Require `MCP_AUTH_TOKEN` for HTTP MCP requests.  
**Reason:** Reduce unauthorized access to file operations.  
**Status:** Implemented. Use a strong secret and never commit it.

### 12. Request-body limit
**Decision:** Limit HTTP request body size.  
**Reason:** Reduce the risk of excessive memory use from oversized requests.  
**Status:** Implemented; use the current automated test output to confirm exact behavior on the submitted version.

### 13. Shared path validation
**Decision:** Route file operations through the shared path-safety helper, including append operations, and check existing ancestors/symlink targets.  
**Reason:** A lexical prefix check alone can allow a symlink to redirect a write outside the workspace.  
**Status:** Implemented; regression tests are included.

### 14. Audit log and guarded delete
**Decision:** Record mutating operations in a JSON-lines audit log when enabled, and prevent `delete` from removing the four handoff files.  
**Reason:** Improve traceability and protect project handoff state.  
**Status:** Implemented in source; verify configuration and test results for the submitted version.

### 15. PM2 and HTTPS tunnel
**Decision:** Document PM2 supervision and Cloudflare Tunnel as a remote deployment option.  
**Reason:** Expose a local HTTP service through HTTPS without opening an inbound application port directly.  
**Status:** Configuration and instructions exist. Do not claim restart behavior or public endpoint status unless manually verified on the host.

### 16. Separate stdio and HTTP entry points
**Decision:** Keep stdio and HTTP startup paths separate while sharing MCP tool registration.  
**Reason:** Importing the shared server implementation from the HTTP entry point should not inadvertently start stdio transport.  
**Status:** Implemented.

## Documentation policy
The professor clarified that a live demo is not required as a submission deliverable. Documentation should prioritize reproducible setup, accurate implementation details, test instructions, architecture, and security trade-offs. Optional demo documents are not evidence of completion unless they contain actual recorded results.

## Last updated
2026-10-17
