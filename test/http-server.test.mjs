import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { createBridgeHttpServer } from "../figma-in-codex/bridge/http-server.mjs";

test("bridge HTTP server accepts POST state and returns it from GET", async () => {
  const dir = await mkdtemp(join(tmpdir(), "figma-bridge-http-test-"));
  const server = await createBridgeHttpServer({ host: "127.0.0.1", port: 0, statePath: join(dir, "state.json") });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const post = await fetch(`${baseUrl}/api/figma-state`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      file: { name: "生图" },
      page: { id: "0:1", name: "首页" },
      selection: [{ id: "131:2", name: "订单卡片", type: "FRAME" }],
    }),
  });
  assert.equal(post.status, 200);

  const state = await fetch(`${baseUrl}/api/figma-state`).then((response) => response.json());
  assert.equal(state.available, true);
  assert.equal(state.state.file.name, "生图");
  assert.equal(state.state.selection[0].id, "131:2");

  const health = await fetch(`${baseUrl}/api/health`).then((response) => response.json());
  assert.equal(health.ok, true);

  await new Promise((resolve) => server.close(resolve));
  await rm(dir, { recursive: true, force: true });
});
