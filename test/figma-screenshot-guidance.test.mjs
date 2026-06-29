import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { createOfficialFigmaMcpSetupGuide } from "../figma-in-codex/mcp/lib/official-figma-mcp.mjs";
import { resolveCurrentFigmaTarget } from "../figma-in-codex/mcp/lib/target-resolver.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("read setup guide defaults to structured Figma context without screenshot", () => {
  const guide = createOfficialFigmaMcpSetupGuide({ intent: "read" });

  assert.deepEqual(guide.requiredTools, ["get_metadata", "get_design_context"]);
  assert.equal(guide.requiredFor.includes("screenshot"), false);
  assert.match(guide.userMessage, /结构化|详情|节点树/);
});

test("target resolver read steps require structured checks before screenshot", () => {
  const result = resolveCurrentFigmaTarget({
    browserContext: { ok: true, fileKey: "abc", nodeId: "1:2", kind: "design" },
    bridgeState: { available: false },
  });

  assert.ok(result.nextSteps.some((step) => step.includes("get_metadata")));
  assert.ok(result.nextSteps.some((step) => step.includes("get_design_context")));
  assert.equal(result.nextSteps.some((step) => /get_screenshot.*before making or describing visual changes/.test(step)), false);
  assert.ok(result.nextSteps.some((step) => step.includes("after structured checks cannot answer")));
  assert.equal(result.nextSteps.some((step) => step.includes("visual verification is necessary")), false);
});

test("skills require structured verification before screenshot usage", async () => {
  const skillPaths = [
    "figma-in-codex/skills/figma-current-context/SKILL.md",
    "figma-in-codex/skills/figma-edit-current-selection/SKILL.md",
    "figma-in-codex/skills/figma-create-in-current-file/SKILL.md",
  ];

  for (const path of skillPaths) {
    const text = await readFile(resolve(repoRoot, path), "utf8");
    assert.doesNotMatch(text, /get_metadata`?\s+(?:and|,)\s+`?get_screenshot/);
    assert.doesNotMatch(text, /Call .*`get_screenshot` again/);
    assert.doesNotMatch(text, /visual verification is necessary/);
    assert.doesNotMatch(text, /视觉验收时使用/);
    assert.match(text, /get_design_context/);
    assert.match(text, /structured checks cannot answer|结构化检查无法回答/);
  }
});

test("docs do not advertise screenshots as a core verification path", async () => {
  const docs = [
    "README.md",
    "figma-in-codex/README.md",
    "figma-in-codex/.codex-plugin/plugin.json",
  ];

  for (const path of docs) {
    const text = await readFile(resolve(repoRoot, path), "utf8");
    assert.doesNotMatch(text, /截图验证|screenshot verification|verify it with a screenshot/i);
    assert.doesNotMatch(text, /captures screenshots, writes canvas changes, and verifies results/i);
    assert.doesNotMatch(text, /截图、写入画布和验证修改结果/);
  }
});
