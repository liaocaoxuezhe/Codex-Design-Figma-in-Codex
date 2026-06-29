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
];

const WRITE_TOOLS = [
  OFFICIAL_FIGMA_MCP_TOOLS.useFigma,
];

const OPTIONAL_VISUAL_TOOLS = [
  OFFICIAL_FIGMA_MCP_TOOLS.getScreenshot,
];

export function createOfficialFigmaMcpSetupGuide({ intent = "read" } = {}) {
  const needsWrite = intent === "write" || intent === "create";
  const requiredFor = needsWrite
    ? ["read", "write"]
    : ["read"];
  const requiredTools = needsWrite ? Array.from(new Set([...READ_TOOLS, ...WRITE_TOOLS])) : READ_TOOLS;

  return {
    required: true,
    name: "Official Figma MCP",
    remoteServerUrl: OFFICIAL_FIGMA_MCP_URL,
    requiredFor,
    requiredTools,
    optionalTools: OPTIONAL_VISUAL_TOOLS,
    toolPurposes: {
      get_metadata: "获取整个页面/文件的高层节点树、页面结构、节点列表；当还不知道具体 nodeId 时优先使用。",
      get_design_context: "获取某个 nodeId 的结构化详情、参考代码、设计上下文；这是读取单个节点的主要工具。",
      get_screenshot: "获取截图；消耗 token 较多。先用结构化信息和 use_figma 几何检查，只有结构化检查无法回答具体视觉问题或用户明确要求截图时才使用。",
    },
    codexToolNames: {
      get_metadata: "mcp__plugin_figma_figma__get_metadata",
      get_design_context: "mcp__plugin_figma_figma__get_design_context",
      get_screenshot: "mcp__plugin_figma_figma__get_screenshot",
    },
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
      ? `这个操作需要官方 Figma MCP 先读取结构化详情和页面节点树，再执行修改。请在 Codex 中添加官方 Figma MCP：${OFFICIAL_FIGMA_MCP_URL}，然后按提示完成 Figma 授权；截图只在结构化检查无法回答具体视觉问题或用户明确要求时使用。`
      : `这个操作需要官方 Figma MCP 读取结构化详情和页面节点树。请在 Codex 中添加官方 Figma MCP：${OFFICIAL_FIGMA_MCP_URL}，然后按提示完成 Figma 授权；截图只在结构化检查无法回答具体视觉问题或用户明确要求时使用。`,
    limitations: [
      "figma-in-codex 只能解析当前文件和选区，不能替代官方 Figma MCP 的读写权限。",
      "如果官方 Figma MCP 未安装或未认证，请先完成添加和授权，再重试读取、修改或必要的视觉验证。",
    ],
  };
}
