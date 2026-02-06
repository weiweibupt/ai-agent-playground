# MCP (Model Context Protocol) 完全指南

## 🎯 MCP 是什么？

MCP (Model Context Protocol) 是一个**开放协议**，用于在 AI 应用（如 LLM）和外部工具、数据源之间建立标准化连接。

### 核心概念

```
┌─────────────┐    MCP协议    ┌─────────────┐
│   Client    │ ←----------→  │   Server    │
│  (AI应用)    │               │  (工具提供者) │
└─────────────┘               └─────────────┘
```

- **Client (客户端)**: 需要使用工具的 AI 应用
- **Server (服务器)**: 提供工具和资源的服务
- **Protocol (协议)**: 定义客户端和服务器如何通信

## 🔗 连接原理详解

### 1. 点对点连接
每个 MCP 连接都是**点对点**的：
- 一个客户端可以连接多个服务器
- 一个服务器可以被多个客户端连接
- 每个连接都是独立的

```
Client A ←→ Server 1
Client A ←→ Server 2
Client B ←→ Server 1
Client B ←→ Server 3
```

### 2. 传输方式
MCP 支持多种传输方式：
- **stdio**: 通过标准输入输出通信（最常用）
- **HTTP/SSE**: 通过 HTTP 和服务器发送事件
- **WebSocket**: 通过 WebSocket 连接

### 3. 连接建立过程

```typescript
// 1. 创建传输层
const transport = new StdioServerTransport({
  command: "node",
  args: ["server.js"]
});

// 2. 创建客户端
const client = new Client({
  name: "my-client",
  version: "1.0.0"
});

// 3. 建立连接
await client.connect(transport);

// 4. 使用服务器功能
const tools = await client.listTools();
const result = await client.callTool({name: "tool_name", arguments: {}});
```

## 📁 项目文件说明

### 核心文件

1. **McpClient.ts** - 基础客户端实现
   - 连接到单个服务器
   - 调用工具和获取资源
   - 处理连接生命周期

2. **McpServer.ts** - 基础服务器实现
   - 提供计算器、回显、时间工具
   - 处理客户端请求
   - 管理工具注册

3. **MultiConnectionDemo.ts** - 多连接演示
   - 一个客户端连接多个服务器
   - 跨服务器工作流
   - 服务器发现和工具聚合

4. **MultiClientServerDemo.ts** - 多客户端演示
   - 多个客户端连接同一服务器
   - 状态共享和管理
   - 客户端协作

## 🚀 运行演示

### 1. 基础演示
```bash
# 运行基础 MCP 演示
pnpm run mcp:demo
```

### 2. 多连接演示（一个客户端连多个服务器）
```bash
# 运行多连接演示
pnpm run mcp:multi-connection
```

### 3. 多客户端演示（多个客户端连一个服务器）
```bash
# 运行多客户端演示
pnpm run mcp:multi-client
```

### 4. 单独启动服务器
```bash
# 启动计算器服务器
pnpm run mcp:server

# 启动文本处理服务器
pnpm run mcp:text-server

# 启动状态管理服务器
pnpm run mcp:stateful-server
```

## 🔧 MCP 的核心功能

### 1. Tools (工具)
服务器可以提供工具供客户端调用：

```typescript
// 服务器端注册工具
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "calculator",
        description: "执行数学计算",
        inputSchema: {
          type: "object",
          properties: {
            operation: { type: "string" },
            a: { type: "number" },
            b: { type: "number" }
          }
        }
      }
    ]
  };
});

// 客户端调用工具
const result = await client.callTool({
  name: "calculator",
  arguments: { operation: "add", a: 5, b: 3 }
});
```

### 2. Resources (资源)
服务器可以提供资源供客户端读取：

```typescript
// 服务器端提供资源
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "file:///path/to/file.txt",
        name: "示例文件",
        description: "一个示例文本文件"
      }
    ]
  };
});

// 客户端读取资源
const content = await client.readResource({
  uri: "file:///path/to/file.txt"
});
```

### 3. Prompts (提示)
服务器可以提供预定义的提示模板：

```typescript
// 服务器端提供提示
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "code_review",
        description: "代码审查提示",
        arguments: [
          { name: "code", description: "要审查的代码" }
        ]
      }
    ]
  };
});
```

## 🌟 实际应用场景

### 1. AI 代码助手
```
AI Client ←→ File System Server (读写文件)
AI Client ←→ Git Server (版本控制)
AI Client ←→ Database Server (数据查询)
AI Client ←→ API Server (外部服务调用)
```

### 2. 智能聊天机器人
```
Chat Bot ←→ Knowledge Base Server (知识库查询)
Chat Bot ←→ Weather Server (天气信息)
Chat Bot ←→ Calendar Server (日程管理)
Chat Bot ←→ Email Server (邮件处理)
```

### 3. 开发工具集成
```
IDE ←→ Linter Server (代码检查)
IDE ←→ Test Runner Server (测试执行)
IDE ←→ Documentation Server (文档生成)
IDE ←→ Deployment Server (部署管理)
```

## 🎯 MCP 的优势

### 1. **标准化**
- 统一的协议规范
- 跨语言、跨平台支持
- 易于集成和维护

### 2. **模块化**
- 功能解耦，独立开发
- 可插拔的服务架构
- 易于扩展和升级

### 3. **安全性**
- 明确的权限控制
- 沙盒化执行环境
- 审计和监控支持

### 4. **生态系统**
- 丰富的现有服务器
- 活跃的开源社区
- 企业级支持

## 🔄 连接流程详解

### 客户端连接多个服务器

```typescript
class MultiConnectionClient {
  private connections = new Map<string, McpClient>();

  // 1. 添加服务器连接
  async addServer(name: string, command: string, args: string[]) {
    const client = new McpClient(command, args);
    await client.connect();
    this.connections.set(name, client);
  }

  // 2. 调用特定服务器的工具
  async callTool(serverName: string, toolName: string, args: any) {
    const client = this.connections.get(serverName);
    return await client.callTool(toolName, args);
  }
}
```

### 服务器处理多个客户端

```typescript
class StatefulServer {
  private clientStates = new Map<string, any>();

  // 服务器自动处理多个客户端连接
  // 每个连接都是独立的，但可以共享状态
  
  async handleToolCall(clientId: string, toolName: string, args: any) {
    // 根据客户端ID管理不同的状态
    const clientState = this.clientStates.get(clientId) || {};
    
    // 处理工具调用
    const result = await this.processToolCall(toolName, args, clientState);
    
    // 更新客户端状态
    this.clientStates.set(clientId, clientState);
    
    return result;
  }
}
```

## 🎉 总结

MCP 是一个强大的协议，它：

1. **简化了 AI 应用与外部工具的集成**
2. **提供了标准化的通信方式**
3. **支持复杂的多连接场景**
4. **具有良好的扩展性和安全性**

通过 MCP，您可以：
- 构建模块化的 AI 应用
- 复用现有的工具和服务
- 创建可扩展的系统架构
- 实现跨平台的工具集成

这就是 MCP 的核心价值 - **让 AI 应用能够轻松地连接和使用各种外部工具和数据源**！