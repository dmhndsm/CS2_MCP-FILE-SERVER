
import { createServer } from "./server.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/server";
import { createServer as createHttpServer } from "node:http";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "127.0.0.1";

const httpServer = createHttpServer(async (req, res) => {
  try {
    if (req.url !== "/mcp") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found. Use /mcp." }));
      return;
    }

    const chunks: Buffer[] = [];

    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    const body = Buffer.concat(chunks).toString("utf8");

    const webRequest = new Request(`http://${req.headers.host ?? `${HOST}:${PORT}`}${req.url}`, {
      method: req.method,
      headers: req.headers as HeadersInit,
      ...(body && req.method !== "GET" && req.method !== "HEAD"
        ? { body }
        : {}),
    });

    const mcpServer = createServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    await mcpServer.connect(transport);

    const response = await transport.handleRequest(webRequest);

    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));

    if (response.body) {
      for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
        res.write(chunk);
      }
      res.end();
    } else {
      res.end();
    }
  } catch (error) {
    console.error("HTTP request failed:", error);

    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
    }

    res.end(JSON.stringify({ error: "Internal server error" }));
  }
});

httpServer.listen(PORT, HOST, () => {
  console.log(`MCP Streamable HTTP server listening at http://${HOST}:${PORT}/mcp`);
});
