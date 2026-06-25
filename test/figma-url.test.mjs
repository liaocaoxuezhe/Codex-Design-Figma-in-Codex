import assert from "node:assert/strict";
import { test } from "node:test";

import { parseFigmaUrl, normalizeFigmaNodeId } from "../figma-in-codex/mcp/lib/figma-url.mjs";

test("parseFigmaUrl parses design URLs with Chinese file names and node IDs", () => {
  const result = parseFigmaUrl(
    "https://www.figma.com/design/CTiBHuD782jXBuAQtI5WMk/%E7%94%9F%E5%9B%BE?node-id=131-2&t=fYUi5L0RifUJZwo0-0",
  );

  assert.equal(result.ok, true);
  assert.equal(result.kind, "design");
  assert.equal(result.fileKey, "CTiBHuD782jXBuAQtI5WMk");
  assert.equal(result.nodeId, "131:2");
  assert.equal(result.fileName, "生图");
});

test("parseFigmaUrl uses the branch key as file key for branch URLs", () => {
  const result = parseFigmaUrl(
    "https://www.figma.com/design/originalKey/branch/branchKey123/My%20File?node-id=4-5",
  );

  assert.equal(result.ok, true);
  assert.equal(result.kind, "design");
  assert.equal(result.fileKey, "branchKey123");
  assert.equal(result.originalFileKey, "originalKey");
  assert.equal(result.nodeId, "4:5");
  assert.equal(result.fileName, "My File");
});

test("parseFigmaUrl supports board slides and make links", () => {
  assert.deepEqual(
    {
      kind: parseFigmaUrl("https://www.figma.com/board/boardKey/Planning?node-id=7-8").kind,
      nodeId: parseFigmaUrl("https://www.figma.com/board/boardKey/Planning?node-id=7-8").nodeId,
    },
    { kind: "board", nodeId: "7:8" },
  );

  assert.equal(parseFigmaUrl("https://www.figma.com/slides/slideKey/QBR").kind, "slides");

  const make = parseFigmaUrl("https://www.figma.com/make/makeKey/Prototype");
  assert.equal(make.ok, true);
  assert.equal(make.kind, "make");
  assert.equal(make.fileKey, "makeKey");
  assert.equal(make.nodeId, "0:1");
});

test("normalizeFigmaNodeId accepts hyphen and colon forms", () => {
  assert.equal(normalizeFigmaNodeId("131-2"), "131:2");
  assert.equal(normalizeFigmaNodeId("131:2"), "131:2");
  assert.equal(normalizeFigmaNodeId(""), undefined);
});
