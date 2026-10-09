const BRIDGE_URL = "http://127.0.0.1:38447/api/figma-state";
const HEARTBEAT_MS = 10_000;

figma.showUI(__html__, { width: 320, height: 180 });

function nodeSummary(node) {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: "visible" in node ? node.visible : true,
    locked: "locked" in node ? node.locked : false,
    width: "width" in node ? node.width : undefined,
    height: "height" in node ? node.height : undefined,
  };
}

function currentState() {
  const fileKey = figma.fileKey;
  const kind = figma.editorType === "figjam" ? "board" : figma.editorType === "slides" ? "slides" : "design";
  return {
    updatedAt: new Date().toISOString(),
    source: "figma-companion-plugin",
    file: {
      key: fileKey,
      name: figma.root.name,
      kind,
      url: fileKey ? `https://www.figma.com/${kind}/${fileKey}/${encodeURIComponent(figma.root.name)}` : undefined,
    },
    page: {
      id: figma.currentPage.id,
      name: figma.currentPage.name,
    },
    selection: figma.currentPage.selection.map(nodeSummary),
  };
}

let syncing = false;
let syncAgain = false;

async function syncState() {
  if (syncing) {
    syncAgain = true;
    return;
  }
  syncing = true;
  do {
    syncAgain = false;
    const state = currentState();
    try {
      const response = await fetch(BRIDGE_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(state),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      figma.ui.postMessage({ ok: true, updatedAt: state.updatedAt, selectionCount: state.selection.length, fileKeyAvailable: Boolean(state.file.key) });
    } catch (error) {
      figma.ui.postMessage({ ok: false, error: error.message, updatedAt: state.updatedAt, selectionCount: state.selection.length });
    }
  } while (syncAgain);
  syncing = false;
}

figma.on("selectionchange", syncState);
figma.on("currentpagechange", syncState);
setInterval(syncState, HEARTBEAT_MS);
syncState();
