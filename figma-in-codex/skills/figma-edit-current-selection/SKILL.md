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
5. Call official Figma MCP `get_metadata` and `get_screenshot` for the resolved `fileKey` and `nodeId`.
6. Write a short modification plan that names the target and preserves auto layout, component instances, variables, constraints, and existing content not mentioned by the user.
7. Call official Figma MCP `use_figma` with a prompt containing:
   - target `fileKey`
   - target `nodeId`
   - node name and type when available
   - exact requested change
   - preservation constraints
   - screenshot-based acceptance criteria
8. Call official Figma MCP `get_screenshot` again.
9. Call `record_figma_operation` with the request, target, and outcome.
10. Summarize what changed and whether screenshot verification succeeded.
