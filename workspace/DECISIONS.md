# Decisions

## Project: MCP File Server

### Decision 1: Use Node.js and TypeScript
**Decision:** Build the server using Node.js and TypeScript.

**Reason:** TypeScript provides type checking and works with the MCP TypeScript SDK.

**Status:** Implemented.

### Decision 2: Use the MCP TypeScript SDK
**Decision:** Use the MCP SDK to register and expose file-management tools.

**Reason:** It provides the framework for making the server's tools available to MCP clients.

**Status:** Implemented.

### Decision 3: Use Zod for Input Validation
**Decision:** Use Zod schemas for tool inputs.

**Reason:** Input schemas help validate arguments supplied to the tools.

**Status:** Implemented.

### Decision 4: Restrict File Operations to a Workspace
**Decision:** Resolve file paths against a designated workspace and reject paths that escape it.

**Reason:** File operations should be restricted to the intended workspace instead of allowing arbitrary filesystem access.

**Status:** Implemented; additional security testing remains necessary.

### Decision 5: Make the Workspace Path Configurable
**Decision:** Use the `WORKSPACE_ROOT` environment variable when provided. Otherwise, resolve the project's `workspace` directory relative to the server source location.

**Reason:** Avoid tying the server to one computer's absolute directory path and make the project easier to configure elsewhere.

**Status:** Implemented and manually tested.

### Decision 6: Use Stdio Transport During Development
**Decision:** Use standard input/output (stdio) transport for the current development setup.

**Reason:** It allows the server to be tested locally with MCP Inspector.

**Status:** Implemented. Streamable HTTP deployment remains pending.

### Decision 7: Maintain Single-Purpose Tools
**Decision:** Provide separate tools for reading, writing, appending, searching, copying, moving, deleting, and inspecting files and directories.

**Reason:** Focused tools make operations easier to understand, test, and document.

**Status:** Implemented with 13 tools.

### Decision 8: Use Git for Version Control
**Decision:** Maintain the project in a Git repository hosted on GitHub.

**Reason:** Version control records changes and supports recovery and collaboration.

**Status:** In use.

### Decision 9: Maintain Handoff Protocol Files
**Decision:** Maintain `PROJECT_STATE.md`, `PLAN_LOG.md`, `CHECKPOINTS.md`, and `DECISIONS.md` in the workspace.

**Reason:** These files provide a persistent record of the project's state, planned work, verified milestones, and design choices.

**Status:** In progress.

### Decision 10: Test Changes Before Committing
**Decision:** Test each significant change before committing it to Git.

**Reason:** Testing helps detect regressions before changes are added to the project history.

**Status:** Adopted as the development workflow.

## Pending Decisions
- Select and configure the HTTPS tunneling solution.
- Select and configure a process manager.
- Determine the endpoint authentication method for remote access.
- Review and strengthen symbolic-link and path traversal protections.
- Choose a real MCP client for integration testing.
