---
name: figma-onboarding
description: Use when the user asks to start, launch, open, set up, or prepare figma-in-codex / Codex Design for Figma editing.
---

# Figma Onboarding

Use this workflow before read, create, or write workflows when the Figma context is missing or the user explicitly asks to start `figma-in-codex`.

1. Call `get_figma_onboarding_status`.
2. If `needsBridgeStart` is true, start `${PLUGIN_ROOT}/scripts/start-bridge.sh` and keep it running while the user prepares Figma.
3. If `needsBrowserOpen` is true:
   - Use the Codex in-app Browser plugin to open `https://www.figma.com/files/`.
   - If Browser tools are unavailable or website approval blocks navigation, tell the user to open `https://www.figma.com/files/` in the Codex in-app browser manually.
   - Tell the user to sign in if needed, then open the Figma file and page they want to edit.
4. If `needsCompanionPlugin` is true, ask the user to run the Figma companion plugin in the current Figma file.
5. If `needsSelection` is true, ask the user to select a Figma layer/frame or paste a Figma node link.
6. After the user opens the file or changes selection, call `get_figma_onboarding_status` again.
7. When `ready` is true, report the resolved `fileKey`, `nodeId`, node name/type when available, and ask whether the user wants to inspect or modify the target.

Never refresh or close the user's Figma tab just to recover context.
