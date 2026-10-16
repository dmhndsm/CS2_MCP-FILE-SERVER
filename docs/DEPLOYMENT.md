# Deployment: HTTPS Tunnel + PM2

The MCP File Server runs over HTTP on `127.0.0.1:3000`. Cloudflare Tunnel provides public HTTPS access by terminating TLS and forwarding requests to the local server.

These instructions use Windows PowerShell. Bash equivalents are included where applicable.

## 1. Install Tools

Install project dependencies:

```powershell
npm install
```

Install PM2 globally:

```powershell
npm install -g pm2
```

Install Cloudflare Tunnel:

```powershell
winget install Cloudflare.cloudflared
```

Alternatively, download `cloudflared` from the [official Cloudflare installation guide](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/).

Verify that the required commands are available:

```powershell
node --version
npm --version
pm2 --version
cloudflared --version
```

The project requires Node.js 20 or later.

## 2. Configure Secrets and Environment Variables

Set a strong authentication token in the PowerShell session that will run the server:

```powershell
$env:MCP_AUTH_TOKEN = -join ((48..57)+(97..102) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

The generated token is temporary and remains available only in the current PowerShell session and its child processes.

The Bash equivalent is:

```bash
export MCP_AUTH_TOKEN=$(openssl rand -hex 32)
```

Optionally, configure a dedicated workspace directory:

```powershell
$env:WORKSPACE_ROOT = "C:\path\to\a\dedicated\workspace"
```

Replace the example path with the actual workspace directory. Ensure that the directory exists and that the server process has the necessary permissions.

**Security requirements:**

- Never commit `MCP_AUTH_TOKEN` or other secrets to Git.
- Do not include token values in screenshots, logs, or documentation.
- Use a dedicated workspace for files accessible through the MCP tools.
- Keep the token consistent between the running server and any authenticated client.

## 3. Build and Start the Server with PM2

Build the TypeScript project:

```powershell
npm run build
```

Start the server using the project's PM2 configuration:

```powershell
pm2 start ecosystem.config.cjs --update-env
```

Check the process status:

```powershell
pm2 status
```

The server should appear online.

Check the local health endpoint:

```powershell
Invoke-WebRequest http://127.0.0.1:3000/health
```

The expected response body is:

```json
{"status":"ok"}
```

The health endpoint is intended to provide a minimal availability check without exposing sensitive information.

If the server does not start, inspect the PM2 logs:

```powershell
pm2 logs
```

Use the logs to diagnose the issue. Do not publish logs containing secrets.

## 4. Open the HTTPS Tunnel

Start a Cloudflare Quick Tunnel:

```powershell
cloudflared tunnel --url http://127.0.0.1:3000
```

Cloudflare Tunnel prints a public HTTPS URL similar to:

```text
https://<random-name>.trycloudflare.com
```

Use the actual URL printed by your command. The MCP endpoint is the URL followed by `/mcp`.

For example:

```text
https://<random-name>.trycloudflare.com/mcp
```

The URL above is illustrative; replace it with the URL assigned to your running tunnel.

Quick Tunnel URLs are temporary and may change when the tunnel is restarted. A named Cloudflare Tunnel is an alternative when a stable URL is required.

If OAuth discovery is used, configure `PUBLIC_BASE_URL` to match the actual public HTTPS tunnel URL, as required by the project's OAuth configuration.

## 5. Verify the HTTPS Endpoint and Authentication

Set the actual public tunnel URL in your PowerShell session:

```powershell
$PUBLIC_URL = "https://<your-actual-tunnel-url>"
```

Replace the placeholder with the real URL. Do not include `/mcp` in the variable.

Check the public health endpoint:

```powershell
Invoke-WebRequest "$PUBLIC_URL/health"
```

The expected result is a successful health response.

Check that an unauthenticated MCP request is rejected:

```powershell
try {
    Invoke-WebRequest `
        -Uri "$PUBLIC_URL/mcp" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"deployment-check","version":"1.0.0"}}}'
}
catch {
    $_.Exception.Response.StatusCode
}
```

The expected result is `401 Unauthorized` when authentication is required and no authorization header is supplied.

To test an authenticated MCP initialization request, use the same token configured for the running server:

```powershell
$headers = @{
    Authorization = "Bearer $env:MCP_AUTH_TOKEN"
    Accept = "application/json, text/event-stream"
}

$body = @{
    jsonrpc = "2.0"
    id = 1
    method = "initialize"
    params = @{
        protocolVersion = "2025-03-26"
        capabilities = @{}
        clientInfo = @{
            name = "deployment-check"
            version = "1.0.0"
        }
    }
} | ConvertTo-Json -Depth 5

Invoke-WebRequest `
    -Uri "$PUBLIC_URL/mcp" `
    -Method POST `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $body
```

A successful MCP initialization request should return an MCP initialization response. Depending on the transport implementation, the response may use Server-Sent Events.

An HTTP 200 response alone does not establish that every tool works. Verify tool listing and tool calls separately when validating the full MCP workflow.

## 6. Verify PM2 Process Recovery

PM2 supervises the server process and can restart it if the process exits unexpectedly.

Check the current process:

```powershell
pm2 status
```

Inspect the process details:

```powershell
pm2 describe mcp-file-server
```

Use the actual process name displayed by PM2 if it differs from `mcp-file-server`.

To verify restart behavior, identify the server process PID and terminate that process. Do not terminate the PM2 daemon itself.

```powershell
taskkill /PID <pid> /F
```

Replace `<pid>` with the actual server process ID shown by PM2.

Check the process again:

```powershell
pm2 status
```

Confirm that the server returns to the online state and that the restart count increases. Then check the health endpoint again:

```powershell
Invoke-WebRequest http://127.0.0.1:3000/health
```

Perform this check only when you are ready to interrupt the server briefly. Do not claim restart recovery has been verified until the test has actually been performed.

For persistent PM2 configuration, `pm2 save` can save the current process list. Automatic startup configuration depends on the operating system and the startup mechanism installed on the host.

## 7. Connect an MCP Client

Use a compatible MCP client that supports Streamable HTTP and bearer-token authentication.

Configure the client with the actual public MCP endpoint:

```text
https://<your-actual-tunnel-url>/mcp
```

Configure the authorization header:

```text
Authorization: Bearer <your-token>
```

Replace both placeholders with the actual values in the client's configuration. Do not commit these values to the repository.

MCP Inspector is another option for testing the connection:

```powershell
npx @modelcontextprotocol/inspector
```

Select Streamable HTTP, enter the public `/mcp` endpoint, and configure the authorization header through the Inspector interface.

Verify that the client can initialize, list tools, and execute an appropriate tool call. Record only results that were actually observed.

## 8. Verification Evidence

The following screenshots document the verification work performed on the project. Image paths are relative to this file in `docs/`.

### 8.1 MCP Server Initialization

The server returned HTTP 200 OK and an MCP initialization response for the authenticated initialization request.

![MCP server initialization response](images/server-running.png)

### 8.2 Automated Test Results

The automated test suite completed with 20 tests: 17 passed, 0 failed, and 3 skipped.

![Automated tool test results](images/tool-tests.png)

### 8.3 Security Test Results

The security-only test run completed with 13 tests: 10 passed, 0 failed, and 3 skipped.

The executed tests covered workspace containment,