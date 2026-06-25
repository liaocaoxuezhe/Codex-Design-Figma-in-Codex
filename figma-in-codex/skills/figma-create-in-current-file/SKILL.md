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
5. Inspect nearby context with official Figma MCP `get_metadata`, `get_design_context`, and `get_variable_defs` when available.
6. Prefer existing variables, styles, and components over new primitives.
7. Call official Figma MCP `use_figma` to create the requested design.
8. Verify with `get_screenshot`.
9. Call `record_figma_operation`.
