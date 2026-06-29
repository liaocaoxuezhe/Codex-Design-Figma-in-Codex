import assert from "node:assert/strict";
import { test } from "node:test";

import {
  OFFICIAL_FIGMA_MCP_TOOLS,
  createOfficialFigmaMcpSetupGuide,
} from "../figma-in-codex/mcp/lib/official-figma-mcp.mjs";

test("official Figma MCP setup guide explains install and auth for read workflows", () => {
  const guide = createOfficialFigmaMcpSetupGuide({ intent: "read" });

  assert.equal(guide.required, true);
  assert.equal(guide.remoteServerUrl, "https://mcp.figma.com/mcp");
  assert.deepEqual(guide.requiredFor, ["read"]);
  assert.deepEqual(guide.requiredTools, [
    OFFICIAL_FIGMA_MCP_TOOLS.getMetadata,
    OFFICIAL_FIGMA_MCP_TOOLS.getDesignContext,
  ]);
  assert.deepEqual(guide.optionalTools, [OFFICIAL_FIGMA_MCP_TOOLS.getScreenshot]);
  assert.equal(guide.codexToolNames.get_metadata, "mcp__plugin_figma_figma__get_metadata");
  assert.equal(guide.codexToolNames.get_design_context, "mcp__plugin_figma_figma__get_design_context");
  assert.equal(guide.codexToolNames.get_screenshot, "mcp__plugin_figma_figma__get_screenshot");
  assert.match(guide.userMessage, /添加官方 Figma MCP/);
  assert.match(guide.userMessage, /https:\/\/mcp\.figma\.com\/mcp/);
  assert.match(guide.userMessage, /完成 Figma 授权/);
  assert.match(guide.userMessage, /结构化检查无法回答具体视觉问题/);
  assert.ok(guide.setupSteps.some((step) => step.includes("Settings")));
  assert.ok(guide.authSteps.some((step) => step.includes("Figma")));
});

test("official Figma MCP setup guide includes use_figma for write workflows", () => {
  const guide = createOfficialFigmaMcpSetupGuide({ intent: "write" });

  assert.deepEqual(guide.requiredFor, ["read", "write"]);
  assert.ok(guide.requiredTools.includes(OFFICIAL_FIGMA_MCP_TOOLS.useFigma));
  assert.ok(!guide.requiredTools.includes(OFFICIAL_FIGMA_MCP_TOOLS.getScreenshot));
  assert.match(guide.userMessage, /结构化检查无法回答具体视觉问题/);
});
