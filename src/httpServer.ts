import { createServer } from "./server.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/server";
import { createServer as createHttpServer } from "node:http";
import { randomBytes, timingSafeEqual, createHash } from "node:crypto";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "127.0.0.1";
const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
const MCP_OAUTH_PASSWORD = process.env.MCP_OAUTH_PASSWORD ?? MCP_AUTH_TOKEN;
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
const AUTH_CODE_TTL_MS = 15 * 60 * 1000;

if (!MCP_AUTH_TOKEN || MCP_AUTH_TOKEN.length < 32) {
  throw new Error(
    "MCP_AUTH_TOKEN must be set and contain at least 32 characters.",
  );
}
if (PUBLIC_BASE_URL && !PUBLIC_BASE_URL.startsWith("https://")) {
  throw new Error("PUBLIC_BASE_URL must be an HTTPS URL when set.");
}

const clients = new Map<string, { redirectUris: string[]; name: string }>();
const pendingAuthorizations = new Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    state: string;
    codeChallenge: string;
    resource?: string;
    createdAt: number;
  }
>();
const authorizationCodes = new Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    resource?: string;
    createdAt: number;
  }
>();
const accessTokens = new Map<
  string,
  { clientId: string; resource?: string; expiresAt: number }
>();
const refreshTokens = new Map<
  string,
  { clientId: string; resource?: string }
>();
const browserSessions = new Map<string, number>();

function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
function constantTimeStringEqual(a: string, b: string): boolean {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
function sha256Base64Url(value: string): string {
  return createHash("sha256").update(value).digest("base64url");
}
function baseUrl(req: import("node:http").IncomingMessage): string {
  if (PUBLIC_BASE_URL) return PUBLIC_BASE_URL;
  // Use a configured public HTTPS URL in production; this fallback is for local testing only.
  return `http://${req.headers.host ?? `${HOST}:${PORT}`}`;
}
function json(
  res: import("node:http").ServerResponse,
  status: number,
  data: unknown,
): void {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}
function html(
  res: import("node:http").ServerResponse,
  status: number,
  value: string,
): void {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Security-Policy":
      "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(value);
}
async function readRawBody(
  req: import("node:http").IncomingMessage,
): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += b.length;
    if (size > 64 * 1024) throw new Error("Request body too large");
    chunks.push(b);
  }
  return Buffer.concat(chunks).toString("utf8");
}
async function readForm(
  req: import("node:http").IncomingMessage,
): Promise<URLSearchParams> {
  return new URLSearchParams(await readRawBody(req));
}
function redirect(
  res: import("node:http").ServerResponse,
  location: string,
): void {
  res.writeHead(302, { Location: location, "Cache-Control": "no-store" });
  res.end();
}
function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}

const httpServer = createHttpServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    const pathname = url.pathname;
    const issuer = baseUrl(req);
    const resource = `${issuer}/mcp`;

    if (req.method === "GET" && pathname === "/health") {
      json(res, 200, { status: "ok" });
      return;
    }

    // OAuth/MCP discovery endpoints used by remote MCP clients such as Claude Web.
    if (
      req.method === "GET" &&
      pathname === "/.well-known/oauth-protected-resource"
    ) {
      json(res, 200, {
        resource,
        authorization_servers: [issuer],
        bearer_methods_supported: ["header"],
      });
      return;
    }
    if (
      req.method === "GET" &&
      pathname === "/.well-known/oauth-authorization-server"
    ) {
      json(res, 200, {
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/token`,
        registration_endpoint: `${issuer}/register`,
        response_types_supported: ["code"],
        response_modes_supported: ["query"],
        grant_types_supported: ["authorization_code", "refresh_token"],
        code_challenge_methods_supported: ["S256"],
        token_endpoint_auth_methods_supported: ["none"],
        scopes_supported: ["mcp"],
      });
      return;
    }

    if (req.method === "POST" && pathname === "/register") {
      const rawBody = await readRawBody(req);
      let input: Record<string, unknown>;
      const contentType = String(req.headers["content-type"] ?? "");
      if (contentType.includes("application/json")) {
        try {
          input = JSON.parse(rawBody) as Record<string, unknown>;
        } catch {
          json(res, 400, { error: "invalid_client_metadata" });
          return;
        }
      } else {
        input = Object.fromEntries(new URLSearchParams(rawBody).entries());
      }
      let redirectUris = input.redirect_uris;
      if (typeof redirectUris === "string") {
        try {
          redirectUris = JSON.parse(redirectUris);
        } catch {
          redirectUris = [redirectUris];
        }
      }
      if (
        !Array.isArray(redirectUris) ||
        redirectUris.length === 0 ||
        !redirectUris.every(
          (v) =>
            typeof v === "string" &&
            (v.startsWith("https://") ||
              /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(v)),
        )
      ) {
        json(res, 400, {
          error: "invalid_client_metadata",
          error_description:
            "redirect_uris must contain HTTPS URLs (localhost is allowed for development).",
        });
        return;
      }
      const clientId = randomToken(24);
      const name =
        typeof input.client_name === "string"
          ? input.client_name.slice(0, 100)
          : "MCP client";
      clients.set(clientId, { redirectUris: redirectUris as string[], name });
      json(res, 201, {
        client_id: clientId,
        client_name: name,
        redirect_uris: redirectUris,
        token_endpoint_auth_method: "none",
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
      });
      return;
    }

    if (req.method === "GET" && pathname === "/authorize") {
      const clientId = url.searchParams.get("client_id") ?? "";
      const redirectUri = url.searchParams.get("redirect_uri") ?? "";
      const state = url.searchParams.get("state") ?? "";
      const challenge = url.searchParams.get("code_challenge") ?? "";
      const challengeMethod = url.searchParams.get("code_challenge_method");
      const responseType = url.searchParams.get("response_type");
      const client = clients.get(clientId);
      if (!client || !client.redirectUris.includes(redirectUri)) {
        json(res, 400, {
          error: "invalid_request",
          error_description: "Unknown client or redirect URI.",
        });
        return;
      }
      if (
        responseType !== "code" ||
        !state ||
        !/^[A-Za-z0-9_-]{43}$/.test(challenge) ||
        challengeMethod !== "S256"
      ) {
        json(res, 400, {
          error: "invalid_request",
          error_description:
            "Authorization code flow with PKCE S256 is required.",
        });
        return;
      }
      const requestedResource = url.searchParams.get("resource") ?? undefined;
      if (requestedResource && requestedResource !== resource) {
        json(res, 400, {
          error: "invalid_target",
          error_description: "Resource does not match this MCP server.",
        });
        return;
      }

      const pendingId = randomToken(24);

      pendingAuthorizations.set(pendingId, {
        clientId,
        redirectUri,
        state,
        codeChallenge: challenge,
        resource: requestedResource,
        createdAt: Date.now(),
      });

      console.log("[OAuth] Created pending ID:", pendingId);
      console.log("[OAuth] Pending map size:", pendingAuthorizations.size);

      const cookie = req.headers.cookie ?? "";
      const sessionId = cookie
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("mcp_oauth_session="))
        ?.slice("mcp_oauth_session=".length);
      const sessionExpiry = sessionId
        ? browserSessions.get(sessionId)
        : undefined;
      if (!sessionId || !sessionExpiry || sessionExpiry < Date.now()) {
        const loginPage = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>MCP File Server Login</title><style>body{font:16px system-ui;max-width:520px;margin:10vh auto;padding:24px;color:#222}input,button{padding:12px;width:100%;box-sizing:border-box;margin:8px 0}</style></head><body><h1>MCP File Server Login</h1><p>Enter your server authorization password to continue.</p><form method="post" action="/oauth/login"><input type="hidden" name="pending_id" value="${escapeHtml(pendingId)}"><label>Password<input type="password" name="password" autocomplete="current-password" required></label><button type="submit">Continue</button></form></body></html>`;
        html(res, 200, loginPage);
        return;
      }
      const page = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Authorize MCP File Server</title><style>body{font:16px system-ui;max-width:520px;margin:10vh auto;padding:24px;color:#222}button{padding:12px 18px;margin-right:8px;cursor:pointer}.warn{background:#f5f5f5;padding:12px;border-radius:8px}</style></head><body><h1>Authorize MCP File Server</h1><p><strong>${escapeHtml(client.name)}</strong> wants to connect to your file workspace.</p><p class="warn">Only approve this if you initiated the connection in Claude. The connector may read, create, modify, move, or delete files using the tools you enable.</p><form method="post" action="/oauth/approve"><input type="hidden" name="pending_id" value="${escapeHtml(pendingId)}"><button type="submit">Authorize</button><button type="submit" formaction="/oauth/deny">Cancel</button></form></body></html>`;
      html(res, 200, page);
      return;
    }

    if (req.method === "POST" && pathname === "/oauth/login") {
      const form = await readForm(req);
      const pendingId = form.get("pending_id") ?? "";
      console.log("[OAuth] Approval submitted:", pendingId.slice(0, 8));
      console.log("[OAuth] Pending requests in memory:", pendingAuthorizations.size);
      const pending = pendingAuthorizations.get(pendingId);
      const password = form.get("password") ?? "";
      if (
        !MCP_OAUTH_PASSWORD ||
        !pending ||
        Date.now() - pending.createdAt > AUTH_CODE_TTL_MS ||
        !constantTimeStringEqual(password, MCP_OAUTH_PASSWORD)
      ) {
        html(
          res,
          401,
          "<!doctype html><html><body><h1>Login failed</h1><p>Invalid password or expired request. Return to Claude and try again.</p></body></html>",
        );
        return;
      }
      const sessionId = randomToken();
      browserSessions.set(sessionId, Date.now() + 8 * 60 * 60 * 1000);
      res.writeHead(302, {
        Location: `/authorize/confirm?id=${encodeURIComponent(pendingId)}`,
        "Set-Cookie": `mcp_oauth_session=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`,
        "Cache-Control": "no-store",
      });
      res.end();
      return;
    }

    if (req.method === "GET" && pathname === "/authorize/confirm") {
      const pendingId = url.searchParams.get("id") ?? "";
      const pending = pendingAuthorizations.get(pendingId);
      const cookie = req.headers.cookie ?? "";
      const sessionId = cookie
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("mcp_oauth_session="))
        ?.slice("mcp_oauth_session=".length);
      const sessionExpiry = sessionId
        ? browserSessions.get(sessionId)
        : undefined;
      if (
        !pending ||
        Date.now() > pending.createdAt + AUTH_CODE_TTL_MS ||
        !sessionId ||
        !sessionExpiry ||
        sessionExpiry < Date.now()
      ) {
        json(res, 400, { error: "invalid_request" });
        return;
      }
      const client = clients.get(pending.clientId);
      if (!client) {
        json(res, 400, { error: "invalid_client" });
        return;
      }
      html(
        res,
        200,
        `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Authorize MCP File Server</title><style>body{font:16px system-ui;max-width:520px;margin:10vh auto;padding:24px;color:#222}button{padding:12px 18px;margin-right:8px;cursor:pointer}.warn{background:#f5f5f5;padding:12px;border-radius:8px}</style></head><body><h1>Authorize MCP File Server</h1><p><strong>${escapeHtml(client.name)}</strong> wants to connect to your file workspace.</p><p class="warn">Only approve this if you initiated the connection in Claude. The connector may read, create, modify, move, or delete files using the tools you enable.</p><form method="post" action="/oauth/approve"><input type="hidden" name="pending_id" value="${escapeHtml(pendingId)}"><button type="submit">Authorize</button><button type="submit" formaction="/oauth/deny">Cancel</button></form></body></html>`,
      );
      return;
    }

    if (
      req.method === "POST" &&
      (pathname === "/oauth/approve" || pathname === "/oauth/deny")
    ) {
      const form = await readForm(req);
      const pendingId = form.get("pending_id") ?? "";
      const cookie = req.headers.cookie ?? "";
      const sessionId = cookie
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("mcp_oauth_session="))
        ?.slice("mcp_oauth_session=".length);
      const sessionExpiry = sessionId
        ? browserSessions.get(sessionId)
        : undefined;
      if (!sessionId || !sessionExpiry || sessionExpiry < Date.now()) {
        json(res, 401, { error: "login_required" });
        return;
      }

      console.log("[OAuth] Submitted pending ID:", pendingId);
      console.log(
        "[OAuth] Stored pending IDs:",
        Array.from(pendingAuthorizations.keys()),
      );
      const pending = pendingAuthorizations.get(pendingId);

      if (!pending) {
        console.error("OAuth approval failed: pending request not found.");
        json(res, 400, {
          error: "invalid_request",
          error_description:
            "Pending authorization request not found. Start again from Claude.",
        });
        return;
      }

      if (Date.now() - pending.createdAt > AUTH_CODE_TTL_MS) {
        console.error("OAuth approval failed: pending request expired.");
        pendingAuthorizations.delete(pendingId);
        json(res, 400, {
          error: "invalid_request",
          error_description:
            "Authorization request expired. Start again from Claude.",
        });
        return;
      }

      pendingAuthorizations.delete(pendingId);
      if (pathname === "/oauth/deny") {
        const target = new URL(pending.redirectUri);
        target.searchParams.set("error", "access_denied");
        target.searchParams.set("state", pending.state);
        redirect(res, target.toString());
        return;
      }
      const code = randomToken(32);
      authorizationCodes.set(code, {
        clientId: pending.clientId,
        redirectUri: pending.redirectUri,
        codeChallenge: pending.codeChallenge,
        resource: pending.resource,
        createdAt: Date.now(),
      });
      const target = new URL(pending.redirectUri);
      target.searchParams.set("code", code);
      target.searchParams.set("state", pending.state);
      redirect(res, target.toString());
      return;
    }

    if (req.method === "POST" && pathname === "/token") {
      const form = await readForm(req);
      const grantType = form.get("grant_type");
      const clientId = form.get("client_id") ?? "";
      if (grantType === "authorization_code") {
        const code = form.get("code") ?? "";
        const saved = authorizationCodes.get(code);
        authorizationCodes.delete(code); // Authorization codes are one-use.
        const redirectUri = form.get("redirect_uri") ?? "";
        const verifier = form.get("code_verifier") ?? "";
        if (
          !saved ||
          Date.now() - saved.createdAt > AUTH_CODE_TTL_MS ||
          saved.clientId !== clientId ||
          saved.redirectUri !== redirectUri ||
          verifier.length < 43 ||
          verifier.length > 128 ||
          !constantTimeStringEqual(
            sha256Base64Url(verifier),
            saved.codeChallenge,
          )
        ) {
          json(res, 400, { error: "invalid_grant" });
          return;
        }
        const accessToken = randomToken();
        const refreshToken = randomToken();
        accessTokens.set(accessToken, {
          clientId,
          resource: saved.resource,
          expiresAt: Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000,
        });
        refreshTokens.set(refreshToken, { clientId, resource: saved.resource });
        json(res, 200, {
          access_token: accessToken,
          token_type: "Bearer",
          expires_in: ACCESS_TOKEN_TTL_SECONDS,
          refresh_token: refreshToken,
          scope: "mcp",
        });
        return;
      }
      if (grantType === "refresh_token") {
        const refreshToken = form.get("refresh_token") ?? "";
        const saved = refreshTokens.get(refreshToken);
        if (!saved || saved.clientId !== clientId) {
          json(res, 400, { error: "invalid_grant" });
          return;
        }
        const accessToken = randomToken();
        accessTokens.set(accessToken, {
          clientId,
          resource: saved.resource,
          expiresAt: Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000,
        });
        json(res, 200, {
          access_token: accessToken,
          token_type: "Bearer",
          expires_in: ACCESS_TOKEN_TTL_SECONDS,
          scope: "mcp",
        });
        return;
      }
      json(res, 400, { error: "unsupported_grant_type" });
      return;
    }

    if (pathname !== "/mcp") {
      json(res, 404, { error: "Not found." });
      return;
    }

    const authHeader = req.headers.authorization ?? "";
    const legacyHeader = `Bearer ${MCP_AUTH_TOKEN}`;
    const legacyMatch = constantTimeStringEqual(authHeader, legacyHeader);
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const oauth = accessTokens.get(bearer);
    const oauthMatch =
      !!oauth &&
      oauth.expiresAt > Date.now() &&
      (!oauth.resource || oauth.resource === resource);
    if (!legacyMatch && !oauthMatch) {
      res.writeHead(401, {
        "Content-Type": "application/json",
        "WWW-Authenticate": `Bearer resource_metadata="${issuer}/.well-known/oauth-protected-resource"`,
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    const MAX_BODY_SIZE = 1024 * 1024;
    const declared = Number(req.headers["content-length"] ?? 0);
    if (declared > MAX_BODY_SIZE) {
      json(res, 413, {
        error: "Request body too large. Maximum size is 1 MB.",
      });
      return;
    }
    const chunks: Buffer[] = [];
    let bodySize = 0;
    for await (const chunk of req) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      bodySize += buffer.length;
      if (bodySize > MAX_BODY_SIZE) {
        json(res, 413, {
          error: "Request body too large. Maximum size is 1 MB.",
        });
        req.resume();
        return;
      }
      chunks.push(buffer);
    }
    const body = Buffer.concat(chunks).toString("utf8");
    const webRequest = new Request(
      `http://${req.headers.host ?? `${HOST}:${PORT}`}${req.url}`,
      {
        method: req.method,
        headers: req.headers as HeadersInit,
        ...(body && req.method !== "GET" && req.method !== "HEAD"
          ? { body }
          : {}),
      },
    );
    const mcpServer = createServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await mcpServer.connect(transport);
    const response = await transport.handleRequest(webRequest);
    res.writeHead(
      response.status,
      Object.fromEntries(response.headers.entries()),
    );
    if (response.body) {
      for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>)
        res.write(chunk);
      res.end();
    } else res.end();
  } catch (error) {
    console.error("HTTP request failed:", error);
    if (!res.headersSent) json(res, 500, { error: "Internal server error" });
    else res.end();
  }
});

httpServer.listen(PORT, HOST, () => {
  console.log(
    `MCP Streamable HTTP server listening at http://${HOST}:${PORT}/mcp`,
  );
  if (!PUBLIC_BASE_URL)
    console.warn(
      "WARNING: Set PUBLIC_BASE_URL to your public HTTPS tunnel URL for OAuth discovery to work correctly.",
    );
});
