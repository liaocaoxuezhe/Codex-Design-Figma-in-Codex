---
name: figma-create-in-current-file
description: Use when the user asks to create a page, frame, component, or design inside the current Figma file.
---

# Figma Create In Current File

1. Call `resolve_current_figma_target`.
2. If no selection exists but a file is resolved, create relative to the current page or file root according to the official Figma MCP requirements.
3. Call `prepare_figma_mcp_workflow` with `intent: "create"` and keep its `officialFigmaMcp` setup guide available.
4. If official Figma MCP tools are unavailable, missing, or fail because Figma is not authenticated, stop before creating and tell the user:
   - Add the official Figma MCP remote server in Codex MCP settings.
   - Use `https://mcp.figma.com/mcp` as the server URL.
   - Complete the Figma authorization prompt with an account that can access the target file.
   - Retry the request after Codex shows the Figma MCP is connected.
5. Inspect nearby context with official Figma MCP structured tools:
   - `mcp__plugin_figma_figma__get_metadata` / `get_metadata` for page/file node tree, structure, and node list.
   - `mcp__plugin_figma_figma__get_design_context` / `get_design_context` for node-level structured details when creating relative to a known `nodeId`.
   - `get_variable_defs` when available for variables and styles.
   - For verification, prefer `use_figma` code that reads created node count, frame sizes, text bounds, positions, and overlap relationships.
   - `mcp__plugin_figma_figma__get_screenshot` / `get_screenshot` only when the user explicitly asks for screenshots or structured checks cannot answer a specific visual question. Screenshots are token-expensive.
6. Prefer existing variables, styles, and components over new primitives.
7. Call official Figma MCP `use_figma` to create the requested design.
8. Verify with structured context or `use_figma` geometry checks; use `get_screenshot` only when structured checks cannot answer a specific visual question.
9. Call `record_figma_operation`.
