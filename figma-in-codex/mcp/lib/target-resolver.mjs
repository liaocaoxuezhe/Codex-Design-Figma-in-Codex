import { normalizeFigmaNodeId, parseFigmaUrl } from "./figma-url.mjs";

function isUsableSelection(stateInfo, fileKey) {
  return stateInfo?.available === true
    && stateInfo?.fresh === true
    && stateInfo.state?.file?.key === fileKey
    && Array.isArray(stateInfo.state?.selection);
}

function workflowSteps(canWrite) {
  const readSteps = [
    "Call official Figma MCP get_design_context for a known nodeId; use get_metadata only when the nodeId is unknown or page/file structure is needed.",
    "Use structured metadata, design context, or use_figma geometry checks for verification; call get_screenshot only after structured checks cannot answer a specific visual question or the user explicitly asks for a screenshot.",
  ];
  if (!canWrite) return readSteps;
  return [
    ...readSteps,
    "Create a short modification plan before writing.",
    "Use official Figma MCP use_figma for the write-back.",
    "Record the operation after writing with structured evidence; include screenshot evidence only after structured checks cannot answer a specific visual question.",
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
  if (bridgeState?.available && !bridgeState.fresh && !normalizeFigmaNodeId(explicitNodeId) && !context?.nodeId) {
    warnings.push("Live selection state is stale; run or reconnect the companion plugin before using its selection.");
  }

  if (!context?.fileKey) {
    return {
      canWrite: false,
      target: null,
      warnings: [...warnings, "No Figma fileKey is available. Open a Figma file in the in-app browser or pass an explicitUrl."],
      nextSteps: ["Open a Figma design/board/slides/make URL or paste a Figma node link."],
    };
  }

  if (bridgeState?.available && bridgeState.fresh && bridgeState.state?.selection?.length > 0) {
    const syncedFileKey = bridgeState.state.file?.key;
    if (!syncedFileKey) {
      warnings.push("The companion plugin did not provide a file key; its selection cannot be matched to this Figma file. Use a node link or rerun the updated local/private companion plugin.");
    } else if (syncedFileKey !== context.fileKey) {
      warnings.push("The companion selection belongs to a different Figma file; it will not be used for this target.");
    }
  }

  const explicitNode = normalizeFigmaNodeId(explicitNodeId);
  if (explicitNode) {
    return {
      canWrite: true,
      target: {
        fileKey: context.fileKey,
        url: context.url ?? null,
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

  if (parsedExplicit?.ok && parsedExplicit.nodeId) {
    return {
      canWrite: true,
      target: {
        fileKey: context.fileKey,
        url: context.url ?? null,
        nodeId: parsedExplicit.nodeId,
        fileName: context.fileName,
        kind: context.kind,
        source: "explicit-url",
        confidence: "high",
      },
      warnings,
      nextSteps: workflowSteps(true),
    };
  }

  if (isUsableSelection(bridgeState, context.fileKey) && bridgeState.state.selection.length > 1) {
    const selection = bridgeState.state.selection;
    const target = {
      fileKey: context.fileKey,
      url: context.url ?? null,
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

  if (isUsableSelection(bridgeState, context.fileKey) && bridgeState.state.selection.length === 1) {
    const node = bridgeState.state.selection[0];
    return {
      canWrite: true,
      target: {
        fileKey: context.fileKey,
        url: context.url ?? null,
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
        url: context.url ?? null,
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
      url: context.url ?? null,
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
