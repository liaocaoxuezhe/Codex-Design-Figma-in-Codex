---
name: figma-sync-from-browser
description: Use when Figma bridge state is missing, stale, selection is empty, or Codex cannot identify the current Figma target.
---

# Figma Sync From Browser

Use this recovery workflow when context is unavailable.

1. Call `get_figma_bridge_status`.
2. If the HTTP bridge is not running, start `${PLUGIN_ROOT}/scripts/start-bridge.sh`.
3. Ask the user to run the Figma companion plugin in the current Figma file.
4. If companion plugin access is not possible, ask for a Figma node link and pass it as `explicitUrl` to `resolve_current_figma_target`.
5. Never refresh or close the user's Figma tab just to read state.
