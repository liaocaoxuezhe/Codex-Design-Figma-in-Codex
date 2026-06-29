---
name: figma-current-context
description: Use when the user asks what Figma file, node, page, frame, or selection is currently open or selected.
---

# Figma Current Context

Use the local `figma_in_codex` MCP tools before using official Figma MCP tools.

1. Call `get_figma_bridge_status`.
2. Call `resolve_current_figma_target`.
3. If there is no target, ask the user to open a Figma file or paste a Figma link.
4. If a target exists and the user asks for analysis, call `prepare_figma_mcp_workflow` with `intent: "read"` and keep its `officialFigmaMcp` setup guide available.
5. If official Figma MCP tools are unavailable, missing, or fail because Figma is not authenticated, stop and tell the user:
   - Add the official Figma MCP remote server in Codex MCP settings.
   - Use `https://mcp.figma.com/mcp` as the server URL.
   - Complete the Figma authorization prompt with an account that can access the target file.
   - Retry the request after Codex shows the Figma MCP is connected.
6. If official Figma MCP is available, prefer structured reads:
   - Use `mcp__plugin_figma_figma__get_metadata` / `get_metadata` for the whole file or page: high-level node tree, page structure, and node list. If `nodeId` is unknown, omit it to list top-level pages before drilling in.
   - Use `mcp__plugin_figma_figma__get_design_context` / `get_design_context` for a specific `nodeId`: structured node details, reference code, and design context.
   - Use `mcp__plugin_figma_figma__get_screenshot` / `get_screenshot` only when the user explicitly asks for a screenshot or structured checks cannot answer a specific visual question. Screenshots are token-expensive.
7. Report the resolved `fileKey`, `nodeId`, node name/type when available, and any bridge warnings.

Do not write to Figma from this skill.
