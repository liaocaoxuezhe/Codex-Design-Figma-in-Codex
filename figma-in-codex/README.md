# Codex Design(Figma in Codex)

Codex Design(Figma in Codex) connects Codex's local workflow to the official Figma MCP server by resolving the current Figma file, URL node, and live companion-plugin selection.

## Components

- `mcp/server.mjs`: local MCP tools for context, target resolution, workflow preparation, and operation logs.
- `bridge/http-server.mjs`: localhost state bridge at `http://127.0.0.1:38447`.
- `figma-companion-plugin/`: Figma plugin that syncs page and selection metadata to the local bridge.
- `skills/`: Codex SOPs for reading, editing, creating, and recovering Figma context.

## Local Verification

```bash
npm test
```

## Manual Figma Verification

1. Ask Codex to "Start figma-in-codex and prepare Figma editing context."
2. If Codex opens `https://www.figma.com/files/` in the in-app browser, sign in if needed and open the Figma file and page you want to edit.
3. Run the companion plugin in Figma.
4. Select a frame and confirm `http://127.0.0.1:38447/api/figma-state` updates within 5 seconds.
5. Use Codex with the official Figma MCP authenticated at `https://mcp.figma.com/mcp`.

## Onboarding Flow

The `figma-onboarding` skill calls `get_figma_onboarding_status` to decide whether Codex should start the local bridge, open the in-app browser to `https://www.figma.com/files/`, ask the user to run the companion plugin, or continue with the resolved Figma target.

## Official Figma MCP Requirement

This plugin resolves the current Figma file and selection, but official Figma MCP is required for reading design data, screenshots, canvas writes, and post-write verification.

If official Figma MCP is missing or not authenticated:

1. Open Codex Settings.
2. Go to MCP servers or Connectors.
3. Add the official Figma remote MCP server URL: `https://mcp.figma.com/mcp`.
4. Complete the Figma authorization prompt with an account that can access the target file.
5. Retry the Figma request after Codex shows the Figma MCP is connected.
