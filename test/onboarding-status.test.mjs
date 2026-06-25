import assert from "node:assert/strict";
import { test } from "node:test";

import { getFigmaOnboardingStatus } from "../figma-in-codex/mcp/lib/onboarding-status.mjs";

test("onboarding status asks Codex to open Figma files when no Figma context exists", () => {
  const status = getFigmaOnboardingStatus({
    browserContext: { ok: false, error: "No Figma URL is available.", stateAvailable: false },
    bridgeState: { available: false, fresh: false, error: "No bridge state has been recorded yet." },
    bridgeHealth: { ok: false, error: "connect ECONNREFUSED" },
  });

  assert.equal(status.ready, false);
  assert.equal(status.needsBrowserOpen, true);
  assert.equal(status.needsBridgeStart, true);
  assert.equal(status.needsFigmaFile, true);
  assert.equal(status.browser.openUrl, "https://www.figma.com/files/");
  assert.match(status.userMessage, /https:\/\/www\.figma\.com\/files\//);
});

test("onboarding status asks for the companion plugin when a Figma file is open but selection is not synced", () => {
  const status = getFigmaOnboardingStatus({
    browserContext: {
      ok: true,
      fileKey: "fileKey",
      fileName: "生图",
      kind: "design",
      url: "https://www.figma.com/design/fileKey/%E7%94%9F%E5%9B%BE",
    },
    bridgeState: { available: false, fresh: false, error: "No bridge state has been recorded yet." },
    bridgeHealth: { ok: true, url: "http://127.0.0.1:38447/api/health" },
  });

  assert.equal(status.ready, false);
  assert.equal(status.needsBrowserOpen, false);
  assert.equal(status.needsBridgeStart, false);
  assert.equal(status.needsCompanionPlugin, true);
  assert.equal(status.target.fileKey, "fileKey");
  assert.match(status.userMessage, /companion plugin/i);
});

test("onboarding status is ready when target resolution can write", () => {
  const status = getFigmaOnboardingStatus({
    browserContext: {
      ok: true,
      fileKey: "fileKey",
      fileName: "生图",
      kind: "design",
      nodeId: "1:2",
      url: "https://www.figma.com/design/fileKey/%E7%94%9F%E5%9B%BE?node-id=1-2",
    },
    bridgeState: {
      available: true,
      fresh: true,
      state: {
        selection: [{ id: "3:4", name: "订单卡片", type: "FRAME" }],
      },
    },
    bridgeHealth: { ok: true, url: "http://127.0.0.1:38447/api/health" },
  });

  assert.equal(status.ready, true);
  assert.equal(status.canWrite, true);
  assert.equal(status.target.nodeId, "3:4");
  assert.equal(status.needsSelection, false);
});
