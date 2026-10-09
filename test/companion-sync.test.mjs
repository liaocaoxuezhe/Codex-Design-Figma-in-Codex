import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const root = new URL("../figma-in-codex/figma-companion-plugin/", import.meta.url);

test("local companion reports its file key and keeps an unchanged selection fresh", async () => {
  const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));
  assert.equal(manifest.documentAccess, "dynamic-page");
  assert.equal(manifest.enablePrivatePluginApi, true);
  assert.ok(manifest.networkAccess.allowedDomains.includes("http://127.0.0.1:38447"));

  const source = await readFile(new URL("code.js", root), "utf8");
  const handlers = {};
  const posts = [];
  const messages = [];
  let heartbeat;
  const figma = {
    fileKey: "fileKey",
    editorType: "figma",
    root: { name: "生图" },
    currentPage: { id: "0:1", name: "首页", selection: [{ id: "3:4", name: "卡片", type: "FRAME" }] },
    showUI() {},
    on(event, handler) { handlers[event] = handler; },
    ui: { postMessage(message) { messages.push(message); } },
  };
  runInNewContext(source, {
    figma,
    __html__: "",
    fetch: async (_url, options) => {
      posts.push(JSON.parse(options.body));
      return { ok: true };
    },
    setInterval(callback, ms) {
      heartbeat = callback;
      assert.equal(ms, 10_000);
    },
    Date,
    encodeURIComponent,
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(posts[0].file.key, "fileKey");
  assert.equal(posts[0].file.url, "https://www.figma.com/design/fileKey/%E7%94%9F%E5%9B%BE");
  assert.equal(messages[0].fileKeyAvailable, true);

  heartbeat();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(posts.length, 2);
  assert.equal(posts[1].selection[0].id, "3:4");

  figma.currentPage.selection = [{ id: "5:6", name: "新卡片", type: "FRAME" }];
  handlers.selectionchange();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(posts[2].selection[0].id, "5:6");
});
