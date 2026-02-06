# HTTP MCP 客户端使用指南

本项目现在支持两种类型的 MCP 客户端连接方式：

1. **Stdio 类型**：通过标准输入输出与本地进程通信
2. **HTTP 类型**：通过 HTTP/SSE 与远程服务器通信

## 文件结构

```
src/
├── McpClient.ts          # Stdio 类型的 MCP 客户端
├── McpHttpClient.ts      # HTTP 类型的 MCP 客户端 (新增)
├── McpServer.ts          # Stdio 类型的 MCP 服务器
├── McpHttpServer.ts      # HTTP 类型的 MCP 服务器 (新增)
├── Agent.ts              # 整合了两种客户端的智能代理
├── test-http-mcp.ts      # HTTP MCP 客户端测试脚本 (新增)
└── index.ts              # 主入口文件（交互式对话）
```

## 快速开始

### 1. 启动 HTTP MCP 服务器

在一个终端窗口中启动 HTTP MCP 服务器：

```bash
pnpm run mcp:http-server
```

服务器将在 `http://localhost:3000` 启动，提供以下端点：
- `/sse` - SSE 连接端点（MCP 通信）
- `/health` - 健康检查端点

### 2. 测试 HTTP MCP 客户端

在另一个终端窗口中运行测试脚本：

```bash
pnpm run test:http-mcp
```

这将测试以下功能：
- 连接到 HTTP MCP 服务器
- 调用 HTTP 服务器提供的工具（问候、获取时间）
- 同时使用 Stdio 和 HTTP 两种类型的 MCP 服务器
- 混合调用不同服务器的工具

## Agent 中的使用方法

### 配置 MCP 服务器

在 `Agent.ts` 中，你可以配置多个 MCP 服务器，包括 Stdio 和 HTTP 类型：

```typescript
import { Agent } from "./Agent.js";

const agent = new Agent({
  model: "qwen-turbo",
  systemPrompt: "你是一个友好的AI助手。",
  maxIterations: 10,
});

await agent.initialize({
  mcpServers: [
    // Stdio 类型：本地进程通信
    {
      name: "calculator",
      type: "stdio",
      command: "tsx",
      args: ["src/McpServer.ts"],
    },
    
    // HTTP 类型：远程 HTTP 服务器
    {
      name: "http-server",
      type: "http",
      url: "http://localhost:3000/sse",
    },
    
    // 其他 Stdio 服务器
    {
      name: "fetch",
      type: "stdio",
      command: "uvx",
      args: ["mcp-server-fetch"],
    },
  ],
});

// 使用 Agent
await agent.chat("现在几点了？");
await agent.chat("帮我计算 123 + 456");

// 断开连接
await agent.disconnect();
```

### 服务器配置类型

#### Stdio 服务器配置

```typescript
{
  name: "server-name",      // 服务器名称（唯一）
  type: "stdio",            // 类型：stdio
  command: "command",       // 启动命令
  args: ["arg1", "arg2"]    // 命令参数（可选）
}
```

#### HTTP 服务器配置

```typescript
{
  name: "server-name",      // 服务器名称（唯一）
  type: "http",             // 类型：http
  url: "http://localhost:3000/sse"  // SSE 端点 URL
}
```

## HTTP MCP 服务器提供的工具

默认的 HTTP MCP 服务器提供以下工具：

### 1. greet - 问候工具

向用户发送问候消息。

**参数：**
- `name` (string, 必需): 要问候的人的名字

**示例：**
```typescript
await agent.chat("请用问候工具向'小明'问好");
```

### 2. get_time - 获取时间

获取当前服务器时间（北京时间）。

**参数：** 无

**示例：**
```typescript
await agent.chat("现在几点了？");
```

## 工具命名规则

为了避免不同 MCP 服务器之间的工具名称冲突，Agent 会自动为每个工具添加服务器名前缀：

```
格式：{serverName}__{toolName}

示例：
- calculator__add          # calculator 服务器的 add 工具
- http-server__greet       # http-server 服务器的 greet 工具
- http-server__get_time    # http-server 服务器的 get_time 工具
```

Agent 会自动处理这个命名规则，你在使用时只需要自然地描述需求即可。

## 实现细节

### McpHttpClient 类

`McpHttpClient` 类使用 MCP SDK 提供的 `SSEClientTransport` 来实现 HTTP/SSE 通信：

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

export class McpHttpClient {
  private client: Client;
  private transport: SSEClientTransport;

  constructor(serverUrl: string) {
    this.transport = new SSEClientTransport(new URL(serverUrl));
    this.client = new Client(/*...*/);
  }

  async connect(): Promise<void> {
    await this.client.connect(this.transport);
  }

  async getTools() { /* ... */ }
  async callTool(name: string, args: Record<string, any>) { /* ... */ }
  async disconnect(): Promise<void> { /* ... */ }
}
```

### Agent 的多客户端支持

`Agent` 类通过类型系统和联合类型支持多种客户端：

```typescript
// 客户端 Map，支持两种类型
private mcpClients: Map<string, McpClient | McpHttpClient> = new Map();

// 连接时根据配置类型创建不同的客户端
if (server.type === "http") {
  client = new McpHttpClient(server.url);
} else {
  client = new McpClient(server.command, server.args ?? []);
}
```

## 运行脚本

```bash
# 启动 HTTP MCP 服务器
pnpm run mcp:http-server

# 测试 HTTP MCP 客户端
pnpm run test:http-mcp

# 启动交互式对话（需要先启动 HTTP 服务器并取消注释配置）
pnpm run dev
```

## 注意事项

1. **端口冲突**：默认使用 3000 端口，如需修改请编辑 `McpHttpServer.ts`
2. **CORS 配置**：服务器已配置允许跨域访问
3. **错误处理**：客户端会捕获并记录连接和调用错误
4. **连接管理**：记得在使用完毕后调用 `agent.disconnect()` 断开连接

## 扩展

你可以轻松扩展 HTTP MCP 服务器，添加更多工具：

```typescript
// 在 McpHttpServer.ts 中添加新工具
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      // ... 现有工具
      {
        name: "your_new_tool",
        description: "你的新工具描述",
        inputSchema: {
          type: "object",
          properties: {
            // 定义参数
          },
        },
      },
    ],
  };
});

// 添加工具调用处理
server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;
  
  if (name === "your_new_tool") {
    // 实现工具逻辑
    return {
      content: [{
        type: "text",
        text: "工具执行结果",
      }],
    };
  }
  
  // ... 其他工具处理
});
```

## 总结

现在你的项目支持：
- ✅ Stdio 类型的 MCP 客户端（本地进程通信）
- ✅ HTTP 类型的 MCP 客户端（远程 HTTP/SSE 通信）
- ✅ 在 Agent 中统一管理和调用不同类型的 MCP 服务器
- ✅ 自动处理工具名称冲突
- ✅ 支持同时连接多个不同类型的 MCP 服务器
