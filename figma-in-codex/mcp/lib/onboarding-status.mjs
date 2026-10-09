import { parseFigmaUrl } from "./figma-url.mjs";
import { resolveCurrentFigmaTarget } from "./target-resolver.mjs";

export const FIGMA_FILES_URL = "https://www.figma.com/files/";

function hasFreshMatchingFile(bridgeState, fileKey) {
  return bridgeState?.available === true
    && bridgeState?.fresh === true
    && bridgeState.state?.file?.key === fileKey
    && Array.isArray(bridgeState.state?.selection);
}

function isSameBrowserTarget(targetUrl, currentBrowserUrl) {
  if (!currentBrowserUrl) return false;
  const target = parseFigmaUrl(targetUrl);
  const current = parseFigmaUrl(currentBrowserUrl);
  if (!target.ok || !current.ok) return false;
  return target.kind === current.kind
    && target.fileKey === current.fileKey
    && (!target.nodeId || target.nodeId === current.nodeId);
}

function messageFor(status) {
  if (status.browser.shouldOpen) {
    return `Open ${status.browser.openUrl} in the Codex in-app Browser, then continue with the resolved Figma target.`;
  }
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
  currentBrowserUrl,
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
  const needsBridgeStart = !bridgeRunning && !hasNodeTarget;
  const needsBrowserOpen = !hasFileContext;
  const needsFigmaFile = !hasFileContext;
  const needsCompanionPlugin = hasFileContext && !hasNodeTarget && !hasFreshMatchingFile(bridgeState, resolved.target.fileKey);
  const needsSelection = hasFileContext && !hasNodeTarget;
  const ready = Boolean(hasFileContext && hasNodeTarget && resolved.canWrite);
  const openUrl = resolved.target?.url ?? FIGMA_FILES_URL;
  const validExplicitUrl = explicitUrl && parseFigmaUrl(explicitUrl).ok;
  const shouldOpen = validExplicitUrl
    ? Boolean(resolved.target?.url && !isSameBrowserTarget(openUrl, currentBrowserUrl))
    : needsBrowserOpen;

  const status = {
    ready,
    canWrite: resolved.canWrite,
    target: resolved.target,
    browser: {
      openUrl,
      shouldOpen,
    },
    browserHandoff: {
      required: true,
      url: openUrl,
      preferredMode: "codex-internal-browser",
      action: shouldOpen ? "open-or-navigate" : "focus-existing",
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
