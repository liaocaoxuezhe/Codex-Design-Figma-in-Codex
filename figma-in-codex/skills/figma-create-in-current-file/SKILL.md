---
name: figma-create-in-current-file
description: Use when the user asks to create a page, frame, component, or design inside the current or linked Figma file.
---

# Figma Create In Current File

1. Before reading task source material or calling official Figma MCP, follow `figma-onboarding`: call its local status tool and complete the required visible `browserHandoff` in the Codex in-app Browser. A linked file/node overrides a different open Figma tab. Pass the actual tab URL as both `explicitUrl` and `currentBrowserUrl` after opening it. Keep that browser surface available while creating the design; a link opened only at the end does not satisfy this step.
2. A file key is required. A selected node is optional when creating at the current page or file root. If official Figma MCP is unavailable or unauthenticated, explain the missing connection to `https://mcp.figma.com/mcp`.
3. Inspect a known parent with official Figma MCP `get_design_context`. Use `get_metadata` to locate a parent or understand page structure when the node ID is unknown. Read variables/styles when relevant.
4. Prefer existing variables, styles, and components. Group a coherent creation into one official Figma MCP `use_figma` request.
5. Verify created node count, names, sizes, text bounds, and positions with targeted structured checks. Use get_screenshot only when structured checks cannot answer a specific visual question or the user asks for it; check the actual Figma render when visual quality matters. Before retrying an uncertain write, inspect the target to avoid duplicate creation.
6. Call `record_figma_operation`.
