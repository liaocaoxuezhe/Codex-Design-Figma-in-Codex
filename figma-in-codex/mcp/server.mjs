#!/usr/bin/env node
import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { parseFigmaUrl } from "./lib/figma-url.mjs";
import { createOfficialFigmaMcpSetupGuide } from "./lib/official-figma-mcp.mjs";
import { getFigmaOnboardingStatus } from "./lib/onboarding-status.mjs";
import { createStateStore, DEFAULT_STATE_PATH } from "./lib/state-store.mjs";
import { resolveCurrentFigmaTarget } from "./lib/target-resolver.mjs";

const stateStore = createStateStore(process.env.FIGMA_IN_CODEX_STATE_PATH ?? process.env.FIGMA_CODEX_BRIDGE_STATE_PATH ?? DEFAULT_STATE_PATH);
const operationLogPath = process.env.FIGMA_IN_CODEX_OPERATION_LOG ?? process.env.FIGMA_CODEX_BRIDGE_OPERATION_LOG ?? `${process.env.HOME ?? "."}/.codex/figma-in-codex/operations.jsonl`;

const tools = [
  {
    name: "get_current_figma_browser_context",
    title: "Get Current Figma Browser Context",
    description: "Parse the current or explicit Figma browser URL into fileKey, nodeId, file name, and page kind.",
    inputSchema: z.object({
      url: z.string().optional().describe("Optional Figma URL. Falls back to FIGMA_CURRENT_URL or bridge state file.url."),
    }).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "get_current_figma_selection",
    title: "Get Current Figma Selection",
    description: "Read the latest live Figma selection synced by the companion plugin.",
    inputSchema: z.object({}).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "resolve_current_figma_target",
    title: "Resolve Current Figma Target",
    description: "Resolve the best current Figma target from explicit input, live companion selection, and the in-app browser URL.",
    inputSchema: z.object({
      explicitUrl: z.string().optional(),
      explicitNodeId: z.string().optional(),
      allowMultiSelection: z.boolean().optional(),
    }).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "get_figma_bridge_status",
    title: "Get Figma Bridge Status",
    description: "Check bridge state freshness and local setup status.",
    inputSchema: z.object({}).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "get_figma_onboarding_status",
    title: "Get Figma Onboarding Status",
    description: "Check whether Codex should open Figma, start the bridge, ask for the companion plugin, or continue with the resolved target.",
    inputSchema: z.object({
      explicitUrl: z.string().optional(),
      explicitNodeId: z.string().optional(),
      allowMultiSelection: z.boolean().optional(),
    }).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "prepare_figma_mcp_workflow",
    title: "Prepare Figma MCP Workflow",
    description: "Return official Figma MCP next steps for read or write workflows against the resolved target.",
    inputSchema: z.object({
      intent: z.enum(["read", "write", "create"]).default("read"),
      explicitUrl: z.string().optional(),
      explicitNodeId: z.string().optional(),
      allowMultiSelection: z.boolean().optional(),
    }).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  },
  {
    name: "record_figma_operation",
    title: "Record Figma Operation",
    description: "Record a local audit entry for a Figma MCP operation.",
    inputSchema: z.object({
      target: z.record(z.unknown()).optional(),
      request: z.string().optional(),
      result: z.string().optional(),
      beforeScreenshot: z.string().optional(),
      afterScreenshot: z.string().optional(),
    }).passthrough(),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  },
];

function text(payload) {
  return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
}

async function getBrowserContext(args = {}) {
  const state = await stateStore.readState();
  const url = args.url ?? process.env.FIGMA_CURRENT_URL ?? state.state?.file?.url;
  if (!url) {
    return {
      ok: false,
      error: "No Figma URL is available. Pass url, set FIGMA_CURRENT_URL, or run the companion plugin after opening a Figma file.",
      stateAvailable: state.available,
    };
  }
  return parseFigmaUrl(url);
}

async function getBridgeHealth() {
  const url = "http://127.0.0.1:38447/api/health";
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(500) });
    const payload = await response.json();
    return { ok: response.ok && payload?.ok === true, status: response.status, url, payload };
  } catch (error) {
    return { ok: false, url, error: error.message };
  }
}

async function callTool(name, args = {}) {
  if (name === "get_current_figma_browser_context") return text(await getBrowserContext(args));
  if (name === "get_current_figma_selection") return text(await stateStore.readState());
  if (name === "get_figma_bridge_status") {
    const state = await stateStore.readState();
    const bridgeHealth = await getBridgeHealth();
    return text({
      ok: true,
      httpServer: "Expected at http://127.0.0.1:38447. Start with scripts/start-bridge.sh.",
      bridgeRunning: bridgeHealth.ok,
      bridgeHealth,
      statePath: state.statePath,
      stateAvailable: state.available,
      stateFresh: state.fresh,
      officialFigmaMcp: createOfficialFigmaMcpSetupGuide({ intent: "read" }),
      warnings: state.available ? [] : [state.error],
    });
  }
  if (name === "get_figma_onboarding_status") {
    return text(getFigmaOnboardingStatus({
      explicitUrl: args.explicitUrl,
      explicitNodeId: args.explicitNodeId,
      allowMultiSelection: Boolean(args.allowMultiSelection),
      browserContext: await getBrowserContext({ url: args.explicitUrl }),
      bridgeState: await stateStore.readState(),
      bridgeHealth: await getBridgeHealth(),
    }));
  }
  if (name === "resolve_current_figma_target") {
    return text(resolveCurrentFigmaTarget({
      explicitUrl: args.explicitUrl,
      explicitNodeId: args.explicitNodeId,
      allowMultiSelection: Boolean(args.allowMultiSelection),
      browserContext: await getBrowserContext({ url: args.explicitUrl }),
      bridgeState: await stateStore.readState(),
    }));
  }
  if (name === "prepare_figma_mcp_workflow") {
    const resolved = resolveCurrentFigmaTarget({
      explicitUrl: args.explicitUrl,
      explicitNodeId: args.explicitNodeId,
      allowMultiSelection: Boolean(args.allowMultiSelection),
      browserContext: await getBrowserContext({ url: args.explicitUrl }),
      bridgeState: await stateStore.readState(),
    });
    const intent = args.intent ?? "read";
    const steps = intent === "write" || intent === "create"
      ? ["get_screenshot", "use_figma", "get_screenshot", "record_figma_operation"]
      : ["get_metadata", "get_design_context", "get_screenshot"];
    return text({
      intent,
      target: resolved.target,
      canWrite: resolved.canWrite,
      officialFigmaMcp: createOfficialFigmaMcpSetupGuide({ intent }),
      officialFigmaMcpCalls: steps.map((toolName) => ({ toolName, args: resolved.target ? { fileKey: resolved.target.fileKey, nodeId: resolved.target.nodeId } : {} })),
      warnings: resolved.warnings,
    });
  }
  if (name === "record_figma_operation") {
    await mkdir(dirname(operationLogPath), { recursive: true });
    const entry = { recordedAt: new Date().toISOString(), ...args };
    await appendFile(operationLogPath, `${JSON.stringify(entry)}\n`, "utf8");
    return text({ ok: true, operationLogPath, entry });
  }
  throw new Error(`Unknown tool: ${name}`);
}

const server = new McpServer({ name: "figma-in-codex", version: "0.1.0" });

for (const tool of tools) {
  server.registerTool(
    tool.name,
    {
      title: tool.title,
      description: tool.description,
      inputSchema: tool.inputSchema,
      annotations: tool.annotations,
    },
    async (args = {}) => callTool(tool.name, args),
  );
}

try {
  await server.connect(new StdioServerTransport());
} catch (error) {
  console.error(`Codex Design(Figma in Codex) MCP server failed: ${error.message}`);
  process.exit(1);
}
