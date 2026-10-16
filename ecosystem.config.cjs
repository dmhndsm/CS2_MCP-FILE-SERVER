// PM2 process definition. Secrets come from the environment, never this file.
//   export MCP_AUTH_TOKEN="$(openssl rand -hex 32)"   # >= 32 chars
//   npm run build && pm2 start ecosystem.config.cjs --update-env
module.exports = {
  apps: [
    {
      name: "mcp-file-server",
      script: "dist/httpServer.js",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "5s",
      restart_delay: 2000,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        HOST: "127.0.0.1", // the tunnel connects locally; never bind publicly
        PORT: "3000",
        // MCP_AUTH_TOKEN and WORKSPACE_ROOT are inherited from your shell
      },
    },
  ],
};
