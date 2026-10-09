---
name: figma-onboarding
description: Use when the user asks to start, launch, open, set up, or prepare figma-in-codex / Codex Design for Figma editing.
---

# Figma Onboarding

1. **Visible browser handoff is the first action for a Figma request with a URL.** Call `get_figma_onboarding_status` with that URL as `explicitUrl`. Its `browserHandoff.required` and `browserHandoff.url` mean to open or focus the exact target in the Codex in-app Browser before reading source material or calling official Figma MCP. Do not defer this to the final response.
2. Load `browser:control-in-app-browser` and follow its setup instructions. If browser tools are not visible, discover `node_repl js` as that skill directs; do not infer that browser control is unavailable from the initial tool list. Inspect in-app Browser tabs, reuse one already showing the target file/node, otherwise navigate an existing Figma tab or create one to `browserHandoff.url`. Do not refresh an identical target. Set the in-app Browser's `visibility` capability to `true` when available, and call `tab.markDeliverable()` so the visible tab remains after the turn. Preserve the supplied link through a login redirect.
3. Wait for the Figma canvas to load before checking the actual URL; Figma may briefly omit `node-id` during its own redirect. Confirm the final file key and node ID, then call `get_figma_onboarding_status` with the actual URL as both `explicitUrl` and `currentBrowserUrl`. Without a supplied URL, reuse the current Figma tab, the last companion-synced file, or the Figma files list in that order. If in-app Browser setup actually fails after discovery, explain that failure and give the user the target link; do not claim the browser was opened or substitute an external browser.
4. Start `${PLUGIN_ROOT}/scripts/start-bridge.sh` only if `needsBridgeStart` is true. Keep the bridge running while using companion selection.
5. If `needsCompanionPlugin` is true, run the updated local/private Figma companion plugin in the target file. It syncs the file key and keeps an unchanged selection fresh.
6. If `needsSelection` is true, select a node or use a Figma node link. A valid node link can work without the companion.
7. Recheck `get_figma_onboarding_status` after syncing a selection or completing login. Pass the current tab URL as both `explicitUrl` and `currentBrowserUrl`. Continue directly when `canWrite` is true, or when a file key is available for a read/create request.

Never refresh or close the user's Figma tab just to recover context. Do not treat a stale selection from another file as the current target.
