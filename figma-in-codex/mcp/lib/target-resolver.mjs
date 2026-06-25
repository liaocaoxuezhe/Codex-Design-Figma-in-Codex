import { normalizeFigmaNodeId, parseFigmaUrl } from "./figma-url.mjs";

function isUsableSelection(stateInfo) {
  return stateInfo?.available === true && stateInfo?.fresh === true && Array.isArray(stateInfo.state?.selection);
}

function workflowSteps(canWrite) {
  const readSteps = [
    "Call official Figma MCP get_metadata with fileKey and nodeId.",
    "Call official Figma MCP get_design_context when layout/code context is needed.",
    "Call official Figma MCP get_screenshot before making or describing visual changes.",
  ];
  if (!canWrite) return readSteps;
  return [
    ...readSteps,
    "Create a short modification plan before writing.",
    "Use official Figma MCP use_figma for the write-back.",
    "Call get_screenshot again and record_figma_operation after writing.",
  ];
}

export function resolveCurrentFigmaTarget({
  explicitUrl,
  explicitNodeId,
  allowMultiSelection = false,
  browserContext,
  bridgeState,
} = {}) {
  const warnings = [];
  const parsedExplicit = explicitUrl ? parseFigmaUrl(explicitUrl) : null;
  const context = parsedExplicit?.ok ? parsedExplicit : browserContext?.ok ? browserContext : null;

  if (parsedExplicit && !parsedExplicit.ok) warnings.push(parsedExplicit.error);
  if (bridgeState?.available && !bridgeState.fresh) warnings.push("Live selection state is stale; write operations are blocked until the companion plugin syncs again.");

  if (!context?.fileKey) {
    return {
      canWrite: false,
      target: null,
      warnings: [...warnings, "No Figma fileKey is available. Open a Figma file in the in-app browser or pass an explicitUrl."],
      nextSteps: ["Open a Figma design/board/slides/make URL or paste a Figma node link."],
    };
  }

  const explicitNode = normalizeFigmaNodeId(explicitNodeId);
  if (explicitNode) {
    return {
      canWrite: true,
      target: {
        fileKey: context.fileKey,
        nodeId: explicitNode,
        fileName: context.fileName,
        kind: context.kind,
        source: "explicit-input",
        confidence: "high",
      },
      warnings,
      nextSteps: workflowSteps(true),
    };
  }

  if (isUsableSelection(bridgeState) && bridgeState.state.selection.length > 1) {
    const selection = bridgeState.state.selection;
    const target = {
      fileKey: context.fileKey,
      nodeId: selection.map((node) => normalizeFigmaNodeId(node.id)).join(","),
      fileName: context.fileName,
      kind: context.kind,
      source: "live-selection",
      confidence: allowMultiSelection ? "medium" : "blocked",
      selection,
    };
    return {
      canWrite: Boolean(allowMultiSelection),
      target,
      warnings: allowMultiSelection ? warnings : [...warnings, "Live selection contains multiple nodes; explicit multi-selection permission is required before writing."],
      nextSteps: workflowSteps(Boolean(allowMultiSelection)),
    };
  }

  if (isUsableSelection(bridgeState) && bridgeState.state.selection.length === 1) {
    const node = bridgeState.state.selection[0];
    return {
      canWrite: true,
      target: {
        fileKey: context.fileKey,
        nodeId: normalizeFigmaNodeId(node.id),
        nodeName: node.name,
        nodeType: node.type,
        fileName: context.fileName,
        kind: context.kind,
        source: "live-selection",
        confidence: "high",
      },
      warnings,
      nextSteps: workflowSteps(true),
    };
  }

  if (context.nodeId) {
    return {
      canWrite: true,
      target: {
        fileKey: context.fileKey,
        nodeId: context.nodeId,
        fileName: context.fileName,
        kind: context.kind,
        source: parsedExplicit?.ok ? "explicit-url" : "browser-url",
        confidence: "medium",
      },
      warnings,
      nextSteps: workflowSteps(true),
    };
  }

  return {
    canWrite: false,
    target: {
      fileKey: context.fileKey,
      nodeId: null,
      fileName: context.fileName,
      kind: context.kind,
      source: parsedExplicit?.ok ? "explicit-url" : "browser-url",
      confidence: "low",
    },
    warnings: [...warnings, "No node target is available. Reads may target file/page metadata, but write-back is blocked."],
    nextSteps: ["Select a Figma layer with the companion plugin running or paste a Figma node link."],
  };
}
