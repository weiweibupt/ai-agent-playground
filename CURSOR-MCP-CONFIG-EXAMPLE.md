# Cursor MCP 配置完整示例

本文档演示如何在 Cursor 中配置和使用 MCP Server。

## 📋 目录

1. [创建配置文件](#1-创建配置文件)
2. [配置示例](#2-配置示例)
3. [重启 Cursor](#3-重启-cursor)
4. [使用示例](#4-使用示例)
5. [验证配置](#5-验证配置)
6. [常见问题](#6-常见问题)

---

## 1. 创建配置文件

### macOS/Linux

```bash
# 创建配置文件
touch ~/.cursor/mcp.json

# 编辑配置文件
nano ~/.cursor/mcp.json
# 或使用你喜欢的编辑器
code ~/.cursor/mcp.json
```

### Windows

```powershell
# 创建配置文件
New-Item -Path "$env:APPDATA\Cursor\mcp.json" -ItemType File -Force

# 编辑配置文件
notepad "$env:APPDATA\Cursor\mcp.json"
```

---

## 2. 配置示例

### 示例 1: 配置本项目的计算器 MCP Server

在 `~/.cursor/mcp.json` 中添加以下内容：

```json
{
  "mcpServers": {
    "my-calculator": {
      "command": "tsx",
      "args": ["/Users/weiwei/myCode/ts-node-esm-template/src/stdio_mcp/McpServer.ts"]
    }
  }
}
```

**注意**: 请将路径替换为你的实际项目路径！

### 示例 2: 配置多个 MCP Server

```json
{
  "mcpServers": {
    "my-calculator": {
      "command": "tsx",
      "args": ["/Users/weiwei/myCode/ts-node-esm-template/src/stdio_mcp/McpServer.ts"]
    },
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/weiwei/Documents"
      ]
    }
  }
}
```

### 示例 3: 使用 node 命令（如果没有 tsx）

首先编译 TypeScript：

```bash
cd /Users/weiwei/myCode/ts-node-esm-template
pnpm run build
```

然后配置：

```json
{
  "mcpServers": {
    "my-calculator": {
      "command": "node",
      "args": ["/Users/weiwei/myCode/ts-node-esm-template/dist/stdio_mcp/McpServer.js"]
    }
  }
}
```

---

## 3. 重启 Cursor

配置完成后，**必须重启 Cursor** 才能加载新的 MCP Server 配置。

1. 完全退出 Cursor（Cmd+Q / Alt+F4）
2. 重新打开 Cursor
3. Cursor 会自动连接到配置的 MCP Server

---

## 4. 使用示例

配置完成并重启 Cursor 后，你可以在对话中直接使用这些工具：

### 示例对话 1: 使用计算器

**你说:**
```
帮我计算 123 + 456
```

**Cursor 会:**
1. 识别这是一个计算任务
2. 自动调用 `my-calculator` 服务器的 `calculator` 工具
3. 传入参数: `{operation: "add", a: 123, b: 456}`
4. 返回结果: `计算结果: 123 add 456 = 579`

### 示例对话 2: 获取当前时间

**你说:**
```
现在几点了？
```

**Cursor 会:**
1. 调用 `current_time` 工具
2. 返回当前时间（北京时间）

### 示例对话 3: 回显消息

**你说:**
```
用 echo 工具回显 "Hello MCP!"
```

**Cursor 会:**
1. 调用 `echo` 工具
2. 传入参数: `{message: "Hello MCP!"}`
3. 返回: `回显: Hello MCP!`

### 示例对话 4: 复杂计算

**你说:**
```
帮我计算以下内容：
1. 100 * 50
2. 结果除以 25
3. 再加上 88
```

**Cursor 会:**
1. 调用 `calculator` 工具三次
2. 第一次: `100 * 50 = 5000`
3. 第二次: `5000 / 25 = 200`
4. 第三次: `200 + 88 = 288`
5. 返回最终结果

---

## 5. 验证配置

### 方法 1: 询问可用工具

在 Cursor 中问：

```
你有哪些可用的工具？
```

Cursor 应该会列出包括以下工具：
- `calculator` - 执行基本的数学计算
- `echo` - 回显输入的消息
- `current_time` - 获取当前时间

### 方法 2: 直接测试

尝试以下命令：

```
帮我用计算器算一下 99 * 88
```

如果配置成功，Cursor 会调用工具并返回结果。

### 方法 3: 查看 Cursor 日志

如果遇到问题，可以查看 Cursor 的日志：

**macOS/Linux:**
```bash
tail -f ~/.cursor/logs/main.log
```

**Windows:**
```powershell
Get-Content "$env:APPDATA\Cursor\logs\main.log" -Tail 50 -Wait
```

---

## 6. 常见问题

### Q1: Cursor 找不到 tsx 命令

**解决方案 1**: 全局安装 tsx
```bash
npm install -g tsx
```

**解决方案 2**: 使用 npx
```json
{
  "mcpServers": {
    "my-calculator": {
      "command": "npx",
      "args": [
        "tsx",
        "/Users/weiwei/myCode/ts-node-esm-template/src/stdio_mcp/McpServer.ts"
      ]
    }
  }
}
```

**解决方案 3**: 编译后使用 node
```bash
cd /Users/weiwei/myCode/ts-node-esm-template
pnpm run build
```

然后配置使用编译后的 JS 文件：
```json
{
  "mcpServers": {
    "my-calculator": {
      "command": "node",
      "args": ["/Users/weiwei/myCode/ts-node-esm-template/dist/stdio_mcp/McpServer.js"]
    }
  }
}
```

### Q2: 配置后没有效果

**检查清单:**
1. ✅ 配置文件路径正确（`~/.cursor/mcp.json`）
2. ✅ JSON 格式正确（没有语法错误）
3. ✅ 文件路径使用绝对路径
4. ✅ 已经完全重启 Cursor
5. ✅ MCP Server 文件存在且可执行

### Q3: 工具调用失败

**可能原因:**
1. MCP Server 进程启动失败
2. 工具参数格式不正确
3. 依赖包未安装

**调试方法:**
```bash
# 手动测试 MCP Server 是否能启动
cd /Users/weiwei/myCode/ts-node-esm-template
tsx src/stdio_mcp/McpServer.ts
```

如果能看到 "本地 MCP 服务器启动!!!!!!!!!!!!!!!!" 说明服务器可以正常启动。

### Q4: 如何更新配置

1. 编辑 `~/.cursor/mcp.json`
2. 保存文件
3. 完全重启 Cursor（Cmd+Q / Alt+F4）
4. 重新打开 Cursor

---

## 🎯 本项目 MCP Server 提供的工具

### 1. calculator - 计算器

执行基本的数学计算。

**支持的运算:**
- `add` - 加法
- `subtract` - 减法
- `multiply` - 乘法
- `divide` - 除法

**参数:**
- `operation`: 运算类型（必需）
- `a`: 第一个数字（必需）
- `b`: 第二个数字（必需）

**使用示例:**
```
帮我计算 50 * 20
帮我算一下 100 除以 4
计算 999 + 1
```

### 2. echo - 回显

回显输入的消息。

**参数:**
- `message`: 要回显的消息（必需）

**使用示例:**
```
用 echo 工具回显 "测试消息"
回显一下 "Hello World"
```

### 3. current_time - 当前时间

获取当前时间（北京时间）。

**参数:** 无

**使用示例:**
```
现在几点了？
获取当前时间
告诉我现在的时间
```

---

## 🚀 快速开始

### 一键配置脚本

创建一个脚本来自动配置：

```bash
#!/bin/bash
# setup-cursor-mcp.sh

PROJECT_PATH="/Users/weiwei/myCode/ts-node-esm-template"
CONFIG_FILE="$HOME/.cursor/mcp.json"

# 创建配置目录
mkdir -p "$HOME/.cursor"

# 写入配置
cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "my-calculator": {
      "command": "tsx",
      "args": ["$PROJECT_PATH/src/stdio_mcp/McpServer.ts"]
    }
  }
}
EOF

echo "✅ MCP 配置已写入: $CONFIG_FILE"
echo "📝 请重启 Cursor 以加载配置"
echo ""
echo "配置内容:"
cat "$CONFIG_FILE"
```

运行脚本：

```bash
chmod +x setup-cursor-mcp.sh
./setup-cursor-mcp.sh
```

---

## 📚 更多资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [MCP SDK GitHub](https://github.com/modelcontextprotocol/sdk)
- [Cursor 文档](https://cursor.sh/docs)
- 项目中的其他文档:
  - `MCP-GUIDE.md` - MCP 协议完全指南
  - `HTTP-MCP-GUIDE.md` - HTTP MCP 使用指南

---

## 🎉 总结

配置 Cursor MCP 的步骤：

1. **编辑配置文件** `~/.cursor/mcp.json`
2. **添加 MCP Server 配置**（使用绝对路径）
3. **重启 Cursor**
4. **开始使用**工具！

现在你可以在 Cursor 中自然地使用这些工具了，就像和一个拥有超能力的 AI 助手对话一样！🚀
