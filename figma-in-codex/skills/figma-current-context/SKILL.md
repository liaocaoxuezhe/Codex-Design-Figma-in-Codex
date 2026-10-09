---
name: figma-current-context
description: Use when the user asks what Figma file, node, page, frame, or selection is currently open or selected.
---

# Figma Current Context

1. If the request includes a Figma URL, follow `figma-onboarding` and complete its visible `browserHandoff` before inspecting design data. Otherwise reuse the current Figma tab. Pass the actual tab URL as both `explicitUrl` and `currentBrowserUrl` to `get_figma_onboarding_status`. This returns bridge status and the resolved target.
2. If no Figma tab is open, use the last companion-synced file URL returned as `browser.openUrl` when available, or ask for a Figma link.
3. For design analysis, use official Figma MCP `get_design_context` directly when a node ID is known. Use `get_metadata` when the node ID is unknown or page/file structure is needed. Use `get_screenshot` for a specific visual question that structured checks cannot answer.
4. Report the file key, node ID, node name/type when available, and any bridge warning.

Do not write to Figma from this skill.
