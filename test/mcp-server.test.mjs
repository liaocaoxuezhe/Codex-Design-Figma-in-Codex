import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("MCP server lists all Figma bridge tools", async () => {
  const client = new Client({ name: "figma-bridge-test-client", version: "0.1.0" });
  const transport = new StdioClientTransport({
    command: "node",
    args: ["figma-in-codex/mcp/server.mjs"],
    cwd: new URL("..", import.meta.url),
    stderr: "pipe",
  });

  await client.connect(transport);
  const { tools } = await client.listTools();
  await client.close();

  const toolNames = tools.map((tool) => tool.name);
  assert.deepEqual(toolNames, [
    "get_current_figma_browser_context",
    "get_current_figma_selection",
    "resolve_current_figma_target",
    "get_figma_bridge_status",
    "get_figma_onboarding_status",
    "prepare_figma_mcp_workflow",
    "record_figma_operation",
  ]);
});

test("onboarding MCP accepts the current browser URL for explicit-link navigation", async () => {
  const client = new Client({ name: "figma-browser-target-test", version: "0.1.0" });
  const transport = new StdioClientTransport({
    command: "node",
    args: ["figma-in-codex/mcp/server.mjs"],
    cwd: new URL("..", import.meta.url),
    stderr: "pipe",
  });

  try {
    await client.connect(transport);
    const result = await client.callTool({
      name: "get_figma_onboarding_status",
      arguments: {
        explicitUrl: "https://www.figma.com/design/fileKey/Test?node-id=41-2",
        currentBrowserUrl: "https://www.figma.com/design/fileKey/Test?node-id=273-840",
      },
    });
    const status = JSON.parse(result.content[0].text);
    assert.equal(status.browser.shouldOpen, true);
    assert.match(status.browser.openUrl, /node-id=41-2/);
    assert.equal(result.structuredContent.browserHandoff.required, true);
    assert.equal(result.structuredContent.browserHandoff.url, status.browser.openUrl);
  } finally {
    await client.close();
  }
});

test("record operation schema does not nudge screenshot evidence", async () => {
  const client = new Client({ name: "figma-bridge-test-client", version: "0.1" });
  const transport = new StdioClientTransport({
    command: "node",
    args: ["figma-in-codex/mcp/server.mjs"],
    cwd: new URL("..", import.meta.url),
    stderr: "pipe",
  });

  await client.connect(transport);
  const { tools } = await client.listTools();
  await client.close();

  const recordTool = tools.find((tool) => tool.name === "record_figma_operation");
  const properties = recordTool.inputSchema.properties;
  assert.equal("beforeScreenshot" in properties, false);
  assert.equal("afterScreenshot" in properties, false);
  assert.equal("beforeEvidence" in properties, true);
  assert.equal("afterEvidence" in properties, true);
});

test("MCP server does not respond to JSON-RPC notifications", async () => {
  const child = spawn("node", ["figma-in-codex/mcp/server.mjs"], {
    cwd: new URL("..", import.meta.url),
    stdio: ["pipe", "pipe", "pipe"],
  });

  const lines = [];
  child.stdout.on("data", (chunk) => {
    lines.push(...chunk.toString("utf8").trim().split("\n").filter(Boolean));
  });

  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} })}\n`);

  await new Promise((resolve) => setTimeout(resolve, 100));
  child.kill();
  await once(child, "exit");

  assert.deepEqual(lines, []);
});

test("one onboarding call resolves a live companion file without a browser URL", async () => {
  const dir = await mkdtemp(join(tmpdir(), "figma-onboarding-test-"));
  const statePath = join(dir, "state.json");
  await writeFile(statePath, JSON.stringify({
    updatedAt: new Date().toISOString(),
    source: "figma-companion-plugin",
    file: {
      key: "fileKey",
      name: "生图",
      kind: "design",
      url: "https://www.figma.com/design/fileKey/%E7%94%9F%E5%9B%BE",
    },
    page: { id: "0:1", name: "首页" },
    selection: [{ id: "3:4", name: "卡片", type: "FRAME" }],
  }), "utf8");
  const client = new Client({ name: "figma-onboarding-test", version: "0.1.0" });
  const transport = new StdioClientTransport({
    command: "node",
    args: ["figma-in-codex/mcp/server.mjs"],
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, FIGMA_IN_CODEX_STATE_PATH: statePath },
    stderr: "pipe",
  });
  try {
    await client.connect(transport);
    const result = await client.callTool({ name: "get_figma_onboarding_status", arguments: {} });
    const status = JSON.parse(result.content[0].text);
    assert.equal(status.target.fileKey, "fileKey");
    assert.equal(status.target.nodeId, "3:4");
    assert.equal(status.browser.openUrl, "https://www.figma.com/design/fileKey/%E7%94%9F%E5%9B%BE");
    assert.equal(status.canWrite, true);
  } finally {
    await client.close();
    await rm(dir, { recursive: true, force: true });
  }
});
