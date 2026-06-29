---
name: figma-edit-current-selection
description: Use when the user asks to modify, restyle, rewrite, or update the currently selected Figma layer, frame, or component.
---

# Figma Edit Current Selection

Always resolve the current target through `figma_in_codex` first. Use official Figma MCP for all canvas writes.

1. Call `resolve_current_figma_target`.
2. Stop before writing if `canWrite` is false, selection is stale, there is no `nodeId`, or multiple nodes are selected without explicit permission.
3. Call `prepare_figma_mcp_workflow` with `intent: "write"` and keep its `officialFigmaMcp` setup guide available.
4. If official Figma MCP tools are unavailable, missing, or fail because Figma is not authenticated, stop before writing and tell the user:
   - Add the official Figma MCP remote server in Codex MCP settings.
   - Use `https://mcp.figma.com/mcp` as the server URL.
   - Complete the Figma authorization prompt with an account that can access the target file.
   - Retry the request after Codex shows the Figma MCP is connected.
5. Inspect the resolved target with official Figma MCP structured tools before writing:
   - `mcp__plugin_figma_figma__get_metadata` / `get_metadata` for page/file node tree, structure, and node list.
   - `mcp__plugin_figma_figma__get_design_context` / `get_design_context` for the selected `nodeId` details and design context.
   - For verification, prefer `use_figma` code that reads positions, sizes, text bounds, constraints, and overlap relationships.
   - `mcp__plugin_figma_figma__get_screenshot` / `get_screenshot` only when the user explicitly asks for a screenshot or structured checks cannot answer a specific visual question. Screenshots are token-expensive.
6. Write a short modification plan that names the target and preserves auto layout, component instances, variables, constraints, and existing content not mentioned by the user.
7. Call official Figma MCP `use_figma` with a prompt containing:
   - target `fileKey`
   - target `nodeId`
   - node name and type when available
   - exact requested change
   - preservation constraints
   - acceptance criteria based on structured context and geometry checks
8. After writing, use structured context or `use_figma` geometry checks again. Call `get_screenshot` only when structured checks cannot answer a specific visual question or the user explicitly requested it.
9. Call `record_figma_operation` with the request, target, and outcome.
10. Summarize what changed and name which verification method was used.
