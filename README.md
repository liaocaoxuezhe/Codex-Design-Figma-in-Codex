# Figma Codex Plugins

这个仓库发布 `figma-in-codex` Codex 插件。它把 Codex 本地工作流、Figma companion plugin、以及官方 Figma MCP 连接起来，让 Codex 能识别当前打开的 Figma 文件、页面和选区，并围绕当前设计上下文执行结构化读取、编辑和结构化校验等工作流。

仓库里真正用于安装的插件目录是 `figma-in-codex/`。根目录的 `.agents/plugins/marketplace.json` 是 Codex marketplace 入口，用来让 Codex 从这个仓库发现并安装插件。

## 项目包含什么

- `figma-in-codex/.codex-plugin/plugin.json`：Codex 插件 manifest。
- `figma-in-codex/.mcp.json`：插件自带的本地 MCP server 配置。
- `figma-in-codex/skills/`：Codex 使用 Figma 当前文件、当前选区、创建和编辑流程时的技能说明。
- `figma-in-codex/bridge/http-server.mjs`：本地状态桥，默认监听 `http://127.0.0.1:38447`。
- `figma-in-codex/mcp/server.mjs`：给 Codex 使用的本地 MCP 工具。
- `figma-in-codex/figma-companion-plugin/`：需要在 Figma 桌面端或浏览器中导入的 companion plugin。

## 依赖与前置要求

运行这个插件需要下面这些依赖。`figma-in-codex` 只负责把 Codex 和当前 Figma 上下文连接起来；真正读取、写入和校验 Figma 画布，需要依赖官方 Figma MCP。截图是少数视觉问题的后备手段，不是默认校验路径。

| 依赖 | 是否必须 | 用途 |
| --- | --- | --- |
| Codex | 必须 | 安装和运行本插件。 |
| Node.js | 必须 | 运行本地 bridge、MCP server，并安装 npm 依赖。 |
| 官方 Figma MCP | 必须 | 读取 Figma 设计数据、写入画布，并用结构化数据校验修改结果。 |
| Figma 账号和目标文件权限 | 必须 | 官方 Figma MCP 和 companion plugin 都需要访问目标文件。 |
| Figma companion plugin | 仅无节点链接、需读取实时选区时 | 把当前 Figma 文件、页面和选区同步到本地 bridge。 |

官方 Figma MCP 地址：

```text
https://mcp.figma.com/mcp
```

如果 Codex 里还没有连接官方 Figma MCP，请先在 Codex 设置中添加并完成 Figma 授权。没有这个依赖时，本插件只能解析当前上下文，不能真正读取或修改 Figma 文件。

## 安装方式一：命令行安装

如果你从 Git 仓库安装，把下面的地址替换成实际仓库地址：

```bash
codex plugin marketplace add https://github.com/<owner>/<repo>.git --sparse .agents/plugins --sparse figma-in-codex
```

如果你已经把仓库 clone 到本地，也可以在仓库根目录执行：

```bash
codex plugin marketplace add .
```

然后在 Codex 的插件目录里找到 `Figma Codex Plugins`，安装并启用 `figma-in-codex`。安装后请确认官方 Figma MCP 已连接并处于已认证状态。

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
安装后启用插件，并确认官方 Figma MCP 已连接，地址是 https://mcp.figma.com/mcp。
```

如果你使用的是本地仓库，可以这样说：

```text
请从本地路径 /path/to/figma-codex-plugins 安装 figma-in-codex 插件，并启用它。
```

## Figma companion plugin

如果需要直接读取 Figma 中的实时选区，安装 Codex 插件后再把 companion plugin 导入 Figma：

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

也可以直接指定链接，让 Codex 在内置浏览器中打开对应文件和节点：

```text
使用 figma-in-codex 打开这个 Figma 链接，并以链接中的节点为目标：https://www.figma.com/design/CTiBHuD782jXBuAQtI5WMk/%E7%94%9F%E5%9B%BE?node-id=41-2
```

典型流程：

1. 提供 Figma 节点链接时，Codex 在内置浏览器打开该链接并解析目标；已有相同文件和节点时直接复用。
2. 没有节点链接、需要实时选区时，运行 companion plugin，让它通过本地 bridge 同步当前选区。
3. Codex 通过官方 Figma MCP 读取、修改并验证设计。

## 官方 Figma MCP 配置

本插件依赖官方 Figma MCP。推荐按下面顺序检查：

1. 打开 Codex 设置。
2. 找到 MCP servers 或 Connectors。
3. 添加官方 Figma MCP：`https://mcp.figma.com/mcp`。
4. 按提示登录 Figma 并授权。
5. 确认授权账号能访问你要操作的 Figma 文件。
6. 再运行 `figma-in-codex` 插件工作流。

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

- 这个插件负责解析和同步当前 Figma 上下文；真正读取、写入和结构化校验 Figma 文件仍依赖官方 Figma MCP。截图只在结构化检查无法回答具体视觉问题或用户明确要求时使用。
- `docs/`、`node_modules/`、虚拟环境、本地截图和系统缓存不进入 Git 仓库。
- 如果修改或新增中文文档，请保持文件为 UTF-8 编码。

## 更快的当前文件工作流

用户提供链接时，Codex 优先在内置浏览器打开指定文件和节点；同一目标已打开则直接复用。未提供链接时，优先复用已打开的 Figma 标签页，或打开 companion 最近同步的文件链接。更新后的本地开发 companion 同步 fileKey、页面和选区，并每 10 秒保活；若 Figma 没有提供 fileKey，请改用明确的节点链接，避免误用另一个文件的选区。

本地 MCP 的引导结果会提供 `browserHandoff` 链接；Codex 应在设计任务开始时用内置浏览器完成打开或聚焦、设为可见并保留标签页，再进行官方 Figma MCP 读写。本地 MCP 服务只提供交接信息，实际打开浏览器由 Codex 的浏览器能力执行。

已知节点时，优先用官方 Figma MCP 定向读取；需要页面结构时再读 metadata。画布编辑仍由官方 Figma MCP 的 use_figma 完成，本仓库没有接入独立的 figma_editor 多工具框架。
