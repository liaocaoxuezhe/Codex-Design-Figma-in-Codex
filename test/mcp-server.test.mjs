import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
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
