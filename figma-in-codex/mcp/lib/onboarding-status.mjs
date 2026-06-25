import { resolveCurrentFigmaTarget } from "./target-resolver.mjs";

export const FIGMA_FILES_URL = "https://www.figma.com/files/";

function hasFreshSelection(bridgeState) {
  return bridgeState?.available === true
    && bridgeState?.fresh === true
    && Array.isArray(bridgeState.state?.selection)
    && bridgeState.state.selection.length > 0;
}

function messageFor(status) {
  if (status.ready) {
    return "Figma context is ready. Codex can continue with read or write workflows for the resolved target.";
  }

  const steps = [];
  if (status.needsBridgeStart) steps.push("Start the local bridge with figma-in-codex/scripts/start-bridge.sh.");
  if (status.needsBrowserOpen) steps.push(`Open ${FIGMA_FILES_URL} in the Codex in-app browser, then open the Figma file and page you want to edit.`);
  if (status.needsCompanionPlugin) steps.push("Run the Figma companion plugin in the current Figma file so Codex can read the live selection.");
  if (status.needsSelection) steps.push("Select a Figma layer/frame or paste a Figma node link before writing.");
  return steps.join(" ");
}

export function getFigmaOnboardingStatus({
  browserContext,
  bridgeState,
  bridgeHealth,
  explicitUrl,
  explicitNodeId,
  allowMultiSelection = false,
} = {}) {
  const resolved = resolveCurrentFigmaTarget({
    explicitUrl,
    explicitNodeId,
    allowMultiSelection,
    browserContext,
    bridgeState,
  });
  const hasFileContext = Boolean(resolved.target?.fileKey);
  const hasNodeTarget = Boolean(resolved.target?.nodeId);
  const bridgeRunning = bridgeHealth?.ok === true;
  const needsBridgeStart = !bridgeRunning;
  const needsBrowserOpen = !hasFileContext;
  const needsFigmaFile = !hasFileContext;
  const needsCompanionPlugin = hasFileContext && !hasFreshSelection(bridgeState);
  const needsSelection = hasFileContext && !hasNodeTarget;
  const ready = Boolean(hasFileContext && hasNodeTarget && resolved.canWrite);

  const status = {
    ready,
    canWrite: resolved.canWrite,
    target: resolved.target,
    browser: {
      openUrl: needsBrowserOpen ? FIGMA_FILES_URL : null,
      shouldOpen: needsBrowserOpen,
    },
    bridge: {
      running: bridgeRunning,
      health: bridgeHealth ?? null,
    },
    needsBrowserOpen,
    needsBridgeStart,
    needsFigmaFile,
    needsCompanionPlugin,
    needsSelection,
    warnings: resolved.warnings,
    nextSteps: resolved.nextSteps,
  };

  return {
    ...status,
    userMessage: messageFor(status),
  };
}
