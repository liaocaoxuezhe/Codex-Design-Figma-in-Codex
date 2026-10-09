---
name: figma-edit-current-selection
description: Use when the user asks to modify, restyle, rewrite, or update the currently selected Figma layer, frame, or component.
---

# Figma Edit Current Selection

1. Before official Figma MCP reads or writes, follow `figma-onboarding`: call its local status tool and complete the required visible `browserHandoff` in the Codex in-app Browser. A supplied Figma link takes precedence over another open tab. Then call `get_figma_onboarding_status` with the actual tab URL as both `explicitUrl` and `currentBrowserUrl`. Keep the browser surface open while editing, rather than opening a link only at the end.
2. Stop before writing if `canWrite` is false, there is no node ID, or multiple nodes are selected without explicit permission. An explicit node link remains usable even when an unrelated companion selection is stale.
3. Use official Figma MCP for canvas reads and writes. If it is unavailable or unauthenticated, explain the missing connection to `https://mcp.figma.com/mcp`.
4. Inspect the target with `get_design_context`. Call `get_metadata` only if the node ID is unknown or surrounding page/file structure is needed. Use `get_screenshot` when structured checks cannot answer a specific visual question or the user asks for one.
5. Make a short modification plan that names the target and preserves unrelated content, auto layout, components, variables, and constraints.
6. Send one coherent change request to official Figma MCP `use_figma`, including file key, node ID, exact changes, preservation constraints, and acceptance criteria. Avoid a separate call for every small property change when they form one edit.
7. Verify the changed nodes with targeted structured context or geometry checks. Check the actual Figma render when the requested change is visual. Before retrying an uncertain write, inspect the target to avoid duplicate changes.
8. Call `record_figma_operation` and summarize the result and verification.
