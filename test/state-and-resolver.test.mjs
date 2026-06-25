import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { createStateStore } from "../figma-in-codex/mcp/lib/state-store.mjs";
import { resolveCurrentFigmaTarget } from "../figma-in-codex/mcp/lib/target-resolver.mjs";

test("state store persists UTF-8 Figma state and reports freshness", async () => {
  const dir = await mkdtemp(join(tmpdir(), "figma-bridge-test-"));
  const store = createStateStore(join(dir, "state.json"), { staleAfterMs: 30_000 });

  await store.writeState({
    updatedAt: new Date().toISOString(),
    source: "figma-companion-plugin",
    file: { name: "生图", url: "https://www.figma.com/design/key/%E7%94%9F%E5%9B%BE" },
    page: { id: "0:1", name: "首页" },
    selection: [{ id: "131:2", name: "订单卡片", type: "FRAME", visible: true, locked: false }],
  });

  const state = await store.readState();
  assert.equal(state.available, true);
  assert.equal(state.fresh, true);
  assert.equal(state.state.file.name, "生图");
  assert.equal(state.state.selection[0].name, "订单卡片");

  await rm(dir, { recursive: true, force: true });
});

test("resolveCurrentFigmaTarget prefers explicit URL and explicit node ID", () => {
  const result = resolveCurrentFigmaTarget({
    explicitUrl: "https://www.figma.com/design/fileKey/%E7%94%9F%E5%9B%BE?node-id=1-2",
    explicitNodeId: "9-10",
    browserContext: null,
    bridgeState: null,
  });

  assert.equal(result.canWrite, true);
  assert.equal(result.target.fileKey, "fileKey");
  assert.equal(result.target.nodeId, "9:10");
  assert.equal(result.target.source, "explicit-input");
});

test("resolveCurrentFigmaTarget prefers fresh single live selection over URL node", () => {
  const result = resolveCurrentFigmaTarget({
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
      ageMs: 1000,
      state: {
        updatedAt: new Date().toISOString(),
        selection: [{ id: "3:4", name: "订单卡片", type: "FRAME", visible: true, locked: false }],
      },
    },
  });

  assert.equal(result.canWrite, true);
  assert.equal(result.target.fileKey, "fileKey");
  assert.equal(result.target.nodeId, "3:4");
  assert.equal(result.target.nodeName, "订单卡片");
  assert.equal(result.target.source, "live-selection");
});

test("resolveCurrentFigmaTarget blocks multi-selection writes unless allowed", () => {
  const result = resolveCurrentFigmaTarget({
    allowMultiSelection: false,
    browserContext: { ok: true, fileKey: "fileKey", nodeId: "1:2", kind: "design" },
    bridgeState: {
      available: true,
      fresh: true,
      state: {
        updatedAt: new Date().toISOString(),
        selection: [
          { id: "3:4", name: "A", type: "FRAME" },
          { id: "5:6", name: "B", type: "FRAME" },
        ],
      },
    },
  });

  assert.equal(result.canWrite, false);
  assert.match(result.warnings.join("\n"), /multiple/i);
});
