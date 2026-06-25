# Figma Codex Plugins

这个仓库发布 `figma-in-codex` Codex 插件。它把 Codex 本地工作流、Figma companion plugin、以及官方 Figma MCP 连接起来，让 Codex 能识别当前打开的 Figma 文件、页面和选区，并围绕当前设计上下文执行读取、编辑、截图验证等工作流。

仓库里真正用于安装的插件目录是 `figma-in-codex/`。根目录的 `.agents/plugins/marketplace.json` 是 Codex marketplace 入口，用来让 Codex 从这个仓库发现并安装插件。

## 项目包含什么

- `figma-in-codex/.codex-plugin/plugin.json`：Codex 插件 manifest。
- `figma-in-codex/.mcp.json`：插件自带的本地 MCP server 配置。
- `figma-in-codex/skills/`：Codex 使用 Figma 当前文件、当前选区、创建和编辑流程时的技能说明。
- `figma-in-codex/bridge/http-server.mjs`：本地状态桥，默认监听 `http://127.0.0.1:38447`。
- `figma-in-codex/mcp/server.mjs`：给 Codex 使用的本地 MCP 工具。
- `figma-in-codex/figma-companion-plugin/`：需要在 Figma 桌面端或浏览器中导入的 companion plugin。

## 前置要求

- 已安装 Codex。
- 已安装 Node.js，并能运行 `npm install`。
- 已在 Codex 中启用或认证官方 Figma MCP：`https://mcp.figma.com/mcp`。
- 有目标 Figma 文件的访问权限。

## 安装方式一：命令行安装

如果你从 Git 仓库安装，把下面的地址替换成实际仓库地址：

```bash
codex plugin marketplace add https://github.com/<owner>/<repo>.git --sparse .agents/plugins --sparse figma-in-codex
```

如果你已经把仓库 clone 到本地，也可以在仓库根目录执行：

```bash
codex plugin marketplace add .
```

然后在 Codex 的插件目录里找到 `Figma Codex Plugins`，安装并启用 `figma-in-codex`。

安装后进入插件目录安装依赖：

```bash
cd figma-in-codex
npm install
```

## 安装方式二：用自然语言让 Codex 安装

你也可以直接把仓库地址发给 Codex，并让它代你安装：

```text
请从这个仓库安装 figma-in-codex 插件：https://github.com/<owner>/<repo>.git
需要时使用 sparse 路径 .agents/plugins 和 figma-in-codex。
安装后启用插件，并确认官方 Figma MCP 已连接。
```

如果你使用的是本地仓库，可以这样说：

```text
请从本地路径 /path/to/figma-codex-plugins 安装 figma-in-codex 插件，并启用它。
```

## Figma companion plugin

Codex 插件安装后，还需要把 Figma 侧 companion plugin 导入 Figma：

1. 打开 Figma。
2. 进入 Plugins 的开发插件导入入口。
3. 选择 `figma-in-codex/figma-companion-plugin/manifest.json`。
4. 在你要操作的 Figma 文件中运行 companion plugin。
5. 选择一个 frame 或节点，让 companion plugin 把当前页面和选区同步到本地 bridge。

## 使用方法

在 Codex 中可以这样开始：

```text
Start figma-in-codex and prepare Figma editing context.
```

或者中文表达：

```text
启动 figma-in-codex，使用当前 Figma 文件和选区作为目标。
```

典型流程：

1. Codex 启动本地 bridge 和 MCP server。
2. 你在 Figma 中打开目标文件并运行 companion plugin。
3. companion plugin 把当前文件、页面、选区同步到 `http://127.0.0.1:38447`。
4. Codex 使用 `figma-in-codex` 解析当前目标。
5. Codex 通过官方 Figma MCP 读取、修改并验证设计。

## 本地验证

插件目录内可以运行：

```bash
cd figma-in-codex
npm test
```

如果你只想确认插件结构，可以检查这些文件是否存在：

```bash
test -f figma-in-codex/.codex-plugin/plugin.json
test -f figma-in-codex/.mcp.json
test -f figma-in-codex/figma-companion-plugin/manifest.json
```

## 注意事项

- 这个插件负责解析和同步当前 Figma 上下文；真正读取、写入和截图验证 Figma 文件仍依赖官方 Figma MCP。
- `docs/`、`node_modules/`、虚拟环境、本地截图和系统缓存不进入 Git 仓库。
- 如果修改或新增中文文档，请保持文件为 UTF-8 编码。
