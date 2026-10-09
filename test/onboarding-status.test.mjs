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
  assert.equal(status.browserHandoff.required, true);
  assert.equal(status.browserHandoff.url, "https://www.figma.com/files/");
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
        file: { key: "fileKey" },
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

test("known node link works without bridge startup or companion selection", () => {
  const url = "https://www.figma.com/design/fileKey/Test?node-id=1-2";
  const status = getFigmaOnboardingStatus({
    explicitUrl: url,
    browserContext: { ok: true, fileKey: "fileKey", nodeId: "1:2", kind: "design", url },
    bridgeState: { available: false, fresh: false },
    bridgeHealth: { ok: false },
  });
  assert.equal(status.ready, true);
  assert.equal(status.needsBridgeStart, false);
  assert.equal(status.needsCompanionPlugin, false);
  assert.equal(status.browser.openUrl, url);
  assert.equal(status.browser.shouldOpen, true);
});

test("explicit Figma link opens its target instead of reusing a different browser node", () => {
  const url = "https://www.figma.com/design/fileKey/%E7%94%9F%E5%9B%BE?node-id=41-2&t=abc";
  const base = {
    explicitUrl: url,
    browserContext: { ok: true, fileKey: "fileKey", nodeId: "41:2", kind: "design", url },
    bridgeState: { available: false, fresh: false },
    bridgeHealth: { ok: false },
  };
  const differentNode = getFigmaOnboardingStatus({
    ...base,
    currentBrowserUrl: "https://www.figma.com/design/fileKey/%25E7%2594%259F%25E5%259B%25BE?node-id=273-840",
  });
  assert.equal(differentNode.browser.shouldOpen, true);
  assert.equal(differentNode.browser.openUrl, url);
  assert.deepEqual(differentNode.browserHandoff, {
    required: true,
    url,
    preferredMode: "codex-internal-browser",
    action: "open-or-navigate",
  });
  assert.match(differentNode.userMessage, /Open https:\/\/www\.figma\.com\/design\/fileKey/);

  const sameNode = getFigmaOnboardingStatus({
    ...base,
    currentBrowserUrl: "https://www.figma.com/design/fileKey/%25E7%2594%259F%25E5%259B%25BE?node-id=41-2&t=different",
  });
  assert.equal(sameNode.browser.shouldOpen, false);
  assert.equal(sameNode.browserHandoff.action, "focus-existing");
  assert.equal(sameNode.ready, true);
});

test("fresh matching file with empty selection asks for a node without rerunning companion", () => {
  const status = getFigmaOnboardingStatus({
    browserContext: { ok: true, fileKey: "fileKey", kind: "design" },
    bridgeState: { available: true, fresh: true, state: { file: { key: "fileKey" }, selection: [] } },
    bridgeHealth: { ok: true },
  });
  assert.equal(status.needsCompanionPlugin, false);
  assert.equal(status.needsSelection, true);
});
