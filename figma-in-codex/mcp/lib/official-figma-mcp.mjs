export const OFFICIAL_FIGMA_MCP_URL = "https://mcp.figma.com/mcp";

export const OFFICIAL_FIGMA_MCP_TOOLS = {
  getMetadata: "get_metadata",
  getDesignContext: "get_design_context",
  getScreenshot: "get_screenshot",
  getVariableDefs: "get_variable_defs",
  useFigma: "use_figma",
};

const READ_TOOLS = [
  OFFICIAL_FIGMA_MCP_TOOLS.getMetadata,
  OFFICIAL_FIGMA_MCP_TOOLS.getDesignContext,
  OFFICIAL_FIGMA_MCP_TOOLS.getScreenshot,
];

const WRITE_TOOLS = [
  OFFICIAL_FIGMA_MCP_TOOLS.getScreenshot,
  OFFICIAL_FIGMA_MCP_TOOLS.useFigma,
  OFFICIAL_FIGMA_MCP_TOOLS.getScreenshot,
];

export function createOfficialFigmaMcpSetupGuide({ intent = "read" } = {}) {
  const needsWrite = intent === "write" || intent === "create";
  const requiredFor = needsWrite
    ? ["read", "screenshot", "write", "verification"]
    : ["read", "screenshot", "verification"];
  const requiredTools = needsWrite ? Array.from(new Set([...READ_TOOLS, ...WRITE_TOOLS])) : READ_TOOLS;

  return {
    required: true,
    name: "Official Figma MCP",
    remoteServerUrl: OFFICIAL_FIGMA_MCP_URL,
    requiredFor,
    requiredTools,
    setupSteps: [
      "Open Codex Settings.",
      "Go to MCP servers or Connectors.",
      `Add the official Figma remote MCP server URL: ${OFFICIAL_FIGMA_MCP_URL}`,
      "Save or enable the server, then return to the conversation.",
    ],
    authSteps: [
      "When Codex asks to authenticate Figma, open the authorization link.",
      "Sign in to the Figma account that can access the target file.",
      "Approve the requested Figma permissions.",
      "Return to Codex and retry the Figma request.",
    ],
    userMessage: needsWrite
      ? `这个操作需要官方 Figma MCP 进行读取、截图、修改和验证。请在 Codex 中添加官方 Figma MCP：${OFFICIAL_FIGMA_MCP_URL}，然后按提示完成 Figma 授权。`
      : `这个操作需要官方 Figma MCP 进行读取、截图和验证。请在 Codex 中添加官方 Figma MCP：${OFFICIAL_FIGMA_MCP_URL}，然后按提示完成 Figma 授权。`,
    limitations: [
      "figma-in-codex 只能解析当前文件和选区，不能替代官方 Figma MCP 的读写权限。",
      "如果官方 Figma MCP 未安装或未认证，请先完成添加和授权，再重试读取、截图、修改或验证。",
    ],
  };
}
