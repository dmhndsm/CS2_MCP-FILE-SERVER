# MCP File Server

A custom Model Context Protocol (MCP) file server that provides
controlled file operations inside a sandboxed workspace.

The server supports local MCP connections through **stdio** and remote
MCP connections through **Streamable HTTP**. It provides dedicated tools
for file operations while restricting requested paths to the configured
workspace.

## Project Overview

This project was developed as part of the CS3A / CS3B Elective MCP
project requirements.

**Technology stack** - Node.js 20 or later - TypeScript - Model Context
Protocol (MCP) - `@modelcontextprotocol/server` - Zod - HTTP and
Streamable HTTP transport

Check `package.json` for the exact dependency versions and available
scripts.

## Features

-   Sandboxed workspace for file operations
-   Workspace path validation and symbolic-link checks
-   13 MCP tools
-   Stdio transport for local MCP clients
-   Streamable HTTP transport at `/mcp`
-   Bearer-token authentication for HTTP requests
-   OAuth authorization-code flow with PKCE for supported remote clients
-   1 MB HTTP request-body limit
-   TypeScript type checking
-   Audit logging for mutating operations
-   Project-state and handoff documentation

## Available MCP Tools

  -----------------------------------------------------------------------
  Tool                                Description
  ----------------------------------- -----------------------------------
  `workspace_info`                    Returns information about the
                                      configured workspace.

  `list`                              Lists files and directories.

  `read`                              Reads a file.

  `write`                             Creates or overwrites a file.

  `append`                            Appends content to a file.

  `str_replace`                       Replaces specified text in a file.

  `delete`                            Deletes a file, subject to
                                      safeguards.

  `search`                            Searches workspace files for text.

  `move`                              Moves or renames a supported item.

  `mkdir`                             Creates a directory.

  `file_info`                         Returns information about a file or
                                      directory.

  `copy`                              Copies a supported item.

  `tree`                              Displays the workspace directory
                                      structure.
  -----------------------------------------------------------------------

File operations are intended to remain inside the configured workspace.
Paths that attempt to escape that workspace should be rejected by the
path-security checks.

## Requirements

Install the following before running the project:

-   Node.js 20 or later
-   npm
-   Git

## Installation

Clone the repository:

``` powershell
git clone https://github.com/dmhndsm/CS2_MCP-FILE-SERVER.git
```

Enter the project directory:

``` powershell
cd CS2_MCP-FILE-SERVER
```

Install dependencies:

``` powershell
npm install
```

## Running the Server

### Stdio transport

Start the local MCP server:

``` powershell
npm run dev
```

This runs the TypeScript server through `tsx` and uses stdio for
communication with a compatible MCP client.

### Streamable HTTP transport

The HTTP server requires `MCP_AUTH_TOKEN`. The token must contain at
least 32 characters.

In PowerShell, set a token for local testing:

``` powershell
$env:MCP_AUTH_TOKEN = "REPLACE-WITH-A-STRONG-RANDOM-SECRET-AT-LEAST-32-CHARACTERS"
```

Start the HTTP server:

``` powershell
npm run dev:http
```

By default, the server listens at:

``` text
http://127.0.0.1:3000/mcp
```

The default host is `127.0.0.1` and the default port is `3000`. The
`HOST` and `PORT` environment variables can override these values.

HTTP requests must include the bearer token:

``` http
Authorization: Bearer YOUR_MCP_AUTH_TOKEN
```

Requests without the correct token should receive `401 Unauthorized`.

**Security:** The example token is a placeholder. Generate a strong
random secret for actual use. Do not commit real tokens to Git. The
default HTTP binding is intended for local testing; public access
requires an appropriately secured HTTPS endpoint and suitable deployment
configuration.

## Configuration

  -----------------------------------------------------------------------
  Variable                Purpose                 Default
  ----------------------- ----------------------- -----------------------
  `MCP_AUTH_TOKEN`        Required bearer token   No default
                          for HTTP transport;     
                          must be at least 32     
                          characters              

  `HOST`                  HTTP listening          `127.0.0.1`
                          interface               

  `PORT`                  HTTP listening port     `3000`

  `WORKSPACE_ROOT`        Optional workspace      Determined by the
                          directory override      server's
                                                  path-resolution logic

  `MCP_OAUTH_PASSWORD`    Password protecting the No default
                          browser authorization   
                          flow, when OAuth is     
                          enabled                 

  `PUBLIC_BASE_URL`       Public HTTPS origin     No default
                          used for OAuth metadata 
                          and redirects           
  -----------------------------------------------------------------------

Set environment variables in the same terminal session used to start the
server. `PUBLIC_BASE_URL` must be the public HTTPS origin only, without
the `/mcp` suffix. Update it whenever the tunnel URL changes. Do not
commit real credentials or secrets.

## Claude Web Remote Connector (OAuth)

The HTTP server supports an OAuth authorization-code flow with PKCE for
remote MCP clients such as Claude Web.

Before starting the HTTP server, configure these variables in
PowerShell:

``` powershell
$env:MCP_AUTH_TOKEN = "YOUR-STRONG-BEARER-TOKEN-AT-LEAST-32-CHARACTERS"
$env:MCP_OAUTH_PASSWORD = "YOUR-SEPARATE-STRONG-OAUTH-PASSWORD"
$env:PUBLIC_BASE_URL = "https://YOUR-CURRENT-TUNNEL.trycloudflare.com"
npm run dev:http
```

Use separate secrets for `MCP_AUTH_TOKEN` and `MCP_OAUTH_PASSWORD`. Do
not put actual secrets in this README, screenshots, source control, or
public chat messages.

In Claude Web, add a custom connector using the current public MCP URL,
for example:

``` text
https://YOUR-CURRENT-TUNNEL.trycloudflare.com/mcp
```

Select **Sign in now** and keep the **Streamable HTTP** transport
selected if those options are presented by the client. Complete the
sign-in and authorization flow only when you initiated the connection.

The server's OAuth implementation includes authorization-server and
protected-resource metadata, dynamic client registration, authorization
code with PKCE S256, token exchange, and refresh-token support. Exact
client UI labels may change.

**OAuth limitation:** OAuth clients, authorization codes, sessions, and
tokens are held in memory in the current implementation. Restarting the
server invalidates in-memory state, so a remote client may need to
reconnect. This implementation is intended for a single-user project or
demonstration. Before public production use, consider durable state
storage, rate limiting, session revocation, and stronger operational
monitoring.

## Deployment (HTTPS and PM2)

See [Deployment Guide](docs/DEPLOYMENT.md).

The documented deployment flow includes building the project, starting
the PM2 process, and exposing the local HTTP service through a
configured HTTPS tunnel. For example:

``` powershell
npm run build
pm2 start ecosystem.config.cjs --update-env
cloudflared tunnel --url http://127.0.0.1:3000
```

Use the deployment instructions and environment settings appropriate to
your environment. Do not assume a temporary tunnel URL is permanent.

A `GET /health` endpoint is intended for liveness checks and does not
require authentication. Mutating operations are recorded in
`logs/audit.log`; the location can be overridden with `AUDIT_LOG`, and
logging can be disabled with `AUDIT_LOG=off`, according to the current
implementation. The `delete` tool is intended to delete files and
refuses the four handoff files.

## Testing and Type Checking

Run the automated test suite:

``` powershell
npm test
```

Run the TypeScript check:

``` powershell
npx tsc --noEmit
```

A successful TypeScript check produces no TypeScript errors.

A previously reported development run showed 20 tests, 17 passing, 0
failing, and 3 skipped. Re-run the tests on the current commit before
using that count as the final result.

Reported development testing included MCP Inspector and direct HTTP
requests. Cases included tool discovery, workspace information, file
operations, path-traversal rejection for several tools, HTTP startup,
authentication rejection, and successful MCP initialization and tool
listing.

The HTTP request-body limit is 1 MB. The project notes identify
verification of the oversized-request response (`413 Payload Too Large`)
as a remaining check. Confirm this behavior in the current test suite
before describing it as verified.

These tests do not establish that every tool, attack scenario, or
production deployment has been fully tested.

## Security Considerations

-   File operations are intended to use workspace path validation.
-   Paths that attempt to escape the workspace should be rejected.
-   Symbolic-link checks are implemented, but do not guarantee
    protection against every filesystem race condition.
-   HTTP access requires bearer-token authentication; OAuth access
    tokens are handled separately by the OAuth implementation.
-   HTTP request bodies are limited to 1 MB according to the
    implementation; verify the oversized-request behavior.
-   Use HTTPS for remote connections.
-   Do not expose the local development server directly to the public
    internet without appropriate security and deployment configuration.
-   Use a dedicated workspace and avoid storing sensitive files inside
    it.
-   Review destructive operations such as `delete` before production
    use.
-   Do not publish `MCP_AUTH_TOKEN`, `MCP_OAUTH_PASSWORD`, access
    tokens, authorization codes, session cookies, or PKCE verifiers.

For the technical design and current limitations, see [Technical
Report](docs/TECHNICAL_REPORT.md).

## Project Structure

``` text
mcp-file-server/
├── src/
│   ├── server.ts
│   ├── httpServer.ts
│   ├── tools/
│   └── utils/
│       ├── pathSecurity.ts
│       └── auditLog.ts
├── test/
├── workspace/
│   ├── PROJECT_STATE.md
│   ├── PLAN_LOG.md
│   ├── CHECKPOINTS.md
│   └── DECISIONS.md
├── docs/
│   ├── DEPLOYMENT.md
│   ├── TECHNICAL_REPORT.md
│   └── images/
├── ecosystem.config.cjs
├── manifest.json
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

This is a representative structure. The actual repository may contain
additional files or generated build output.

## Handoff Documentation

The project uses these files to record implementation state and
decisions:

-   `workspace/PROJECT_STATE.md`
-   `workspace/PLAN_LOG.md`
-   `workspace/CHECKPOINTS.md`
-   `workspace/DECISIONS.md`

Keep these documents consistent with the current implementation and
project progress.

## Development Status

### Implemented (according to the current project notes)

-   MCP server with 13 tools
-   Workspace sandbox and path validation
-   Stdio transport
-   Streamable HTTP transport
-   HTTP bearer-token authentication
-   OAuth authorization-code flow with PKCE
-   HTTP request-body size limit
-   Git and GitHub version control
-   PM2 configuration and audit logging
-   Automated tests and initial documentation

### Remaining verification and deployment work

-   Confirm the oversized-request test returns HTTP 413.
-   Complete the final security review.
-   Review workspace configuration for portability.
-   Configure and verify HTTPS deployment if required.
-   Verify process management and restart behavior if required.
-   Test a realistic multi-step workflow using a real MCP client.
-   Complete any additional deliverables required by the latest course
    rubric.

## GitHub Repository

<https://github.com/dmhndsm/CS2_MCP-FILE-SERVER>

The repository has been described as private during development. Verify
the current repository visibility in GitHub settings.

## License

This project is provided for academic and educational purposes. Check
the repository for a formal license file before reusing or
redistributing the code.
