import http from "node:http";
import { createStateStore, DEFAULT_STATE_PATH } from "../mcp/lib/state-store.mjs";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 38447;

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export async function createBridgeHttpServer({
  host = DEFAULT_HOST,
  port = DEFAULT_PORT,
  statePath = process.env.FIGMA_IN_CODEX_STATE_PATH ?? process.env.FIGMA_CODEX_BRIDGE_STATE_PATH ?? DEFAULT_STATE_PATH,
} = {}) {
  const store = createStateStore(statePath);

  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", `http://${request.headers.host ?? `${host}:${port}`}`);

      if (request.method === "OPTIONS") {
        sendJson(response, 200, { ok: true });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/health") {
        const state = await store.readState();
        sendJson(response, 200, {
          ok: true,
          service: "figma-in-codex",
          statePath: store.statePath,
          stateAvailable: state.available,
          stateFresh: state.fresh,
        });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/figma-state") {
        sendJson(response, 200, await store.readState());
        return;
      }

      if (request.method === "POST" && url.pathname === "/api/figma-state") {
        const state = await store.writeState(await readJsonBody(request));
        sendJson(response, 200, { ok: true, state });
        return;
      }

      sendJson(response, 404, { ok: false, error: "Unknown Codex Design(Figma in Codex) endpoint." });
    } catch (error) {
      sendJson(response, 500, { ok: false, error: error.message });
    }
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      resolve();
    });
  });

  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.FIGMA_IN_CODEX_PORT ?? process.env.FIGMA_CODEX_BRIDGE_PORT ?? DEFAULT_PORT);
  const server = await createBridgeHttpServer({ port });
  const address = server.address();
  console.log(`Codex Design(Figma in Codex) HTTP server listening at http://${address.address}:${address.port}`);
}
