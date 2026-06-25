const BRIDGE_URL = "http://127.0.0.1:38447/api/figma-state";

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

async function syncState() {
  const state = {
    updatedAt: new Date().toISOString(),
    source: "figma-companion-plugin",
    file: {
      name: figma.root.name,
    },
    page: {
      id: figma.currentPage.id,
      name: figma.currentPage.name,
    },
    selection: figma.currentPage.selection.map(nodeSummary),
  };

  try {
    const response = await fetch(BRIDGE_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    figma.ui.postMessage({ ok: true, updatedAt: state.updatedAt, selectionCount: state.selection.length });
  } catch (error) {
    figma.ui.postMessage({ ok: false, error: error.message, updatedAt: state.updatedAt, selectionCount: state.selection.length });
  }
}

figma.on("selectionchange", syncState);
figma.on("currentpagechange", syncState);
syncState();
