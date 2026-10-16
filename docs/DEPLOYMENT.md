# Deployment: HTTPS tunnel + PM2

The server speaks plain HTTP on 127.0.0.1; a tunnel terminates TLS and forwards to it.
Run these on the machine that hosts the server (Windows PowerShell shown; bash equivalents in comments).

## 1. Install tools (once)
    npm install
    npm install -g pm2
    winget install Cloudflare.cloudflared      # or: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

## 2. Secrets and config (never commit the token)
    $env:MCP_AUTH_TOKEN = -join ((48..57)+(97..102) | Get-Random -Count 64 | % {[char]$_})   # bash: export MCP_AUTH_TOKEN=$(openssl rand -hex 32)
    $env:WORKSPACE_ROOT = "C:\path\to\a\dedicated\workspace"   # optional

## 3. Build and start under PM2
    npm run build
    pm2 start ecosystem.config.cjs --update-env
    pm2 status
    curl http://127.0.0.1:3000/health            # {"status":"ok"}

## 4. Open the HTTPS tunnel (quick tunnel, no account needed)
    cloudflared tunnel --url http://127.0.0.1:3000
It prints `https://<random>.trycloudflare.com`. Your MCP endpoint is that URL + `/mcp`.
(Alternative: `ngrok http 3000`.)

## 5. Verify from outside
    curl https://<random>.trycloudflare.com/health
    curl -i -X POST https://<random>.trycloudflare.com/mcp          # expect 401 (no token)

## 6. Prove restart behaviour (screenshot these for the demo)
    pm2 status                       # note PID and "restarts" count
    taskkill /PID <pid> /F           # bash: kill -9 <pid>
    pm2 status                       # new PID, restarts +1, status online
    curl http://127.0.0.1:3000/health
Survive reboot (optional): `pm2 save`; on Linux `pm2 startup`; on Windows use `pm2-windows-startup`.

## 7. Connect a real MCP client
Claude Desktop / claude.ai custom connector, or Claude Code:

    claude mcp add --transport http file-server https://<random>.trycloudflare.com/mcp --header "Authorization: Bearer $MCP_AUTH_TOKEN"

MCP Inspector (also valid evidence): `npx @modelcontextprotocol/inspector` -> Streamable HTTP -> URL above -> add the Authorization header.
Note: if your client UI cannot send a custom bearer header, use Claude Code or Inspector for the demo.
