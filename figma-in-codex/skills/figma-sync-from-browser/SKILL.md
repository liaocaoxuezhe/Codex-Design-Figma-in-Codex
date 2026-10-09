---
name: figma-sync-from-browser
description: Use when Figma bridge state is missing, stale, selection is empty, or Codex cannot identify the current Figma target.
---

# Figma Sync From Browser

1. If the request includes a Figma URL, follow `figma-onboarding` and complete its visible `browserHandoff` before syncing or reading design data. Otherwise reuse the target Figma tab. Pass its actual URL as both `explicitUrl` and `currentBrowserUrl` to `get_figma_onboarding_status`.
2. If the bridge is needed but not running, start `${PLUGIN_ROOT}/scripts/start-bridge.sh`.
3. Run the updated local/private companion plugin in that same Figma file. It should show a successful sync and a file key. Keep it open for live selection updates.
4. Recheck `get_figma_onboarding_status` with the current tab URL as both `explicitUrl` and `currentBrowserUrl`. If the companion cannot provide a file key, use an explicit Figma node link; do not combine an unverified selection with a browser URL.
5. Never refresh or close the user's Figma tab just to read state.
