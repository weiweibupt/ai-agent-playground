# TypeScript Node.js ESM Template

TypeScript + Node.js + ESM 项目模板，集成了 AI Agent、MCP 协议和 RAG 功能。

## ✨ 主要功能

### 🤖 AI Agent
- 基于 OpenAI 的对话 Agent
- 支持工具调用（Function Calling）
- 多轮对话管理
- 可扩展的架构设计

### 🔌 MCP 集成
- 支持 Stdio 和 HTTP 两种 MCP 传输方式
- 多 MCP 服务器连接管理
- 自动工具发现和调用
- 详细文档：[MCP-GUIDE.md](./MCP-GUIDE.md)

### 📚 RAG (检索增强生成)
- **轻量级设计**：无需额外数据库，适合快速开发
- **文档索引**：支持 `.txt`, `.md`, `.json` 等格式
- **智能检索**：基于向量相似度的语义检索
- **自动增强**：无缝集成到 Agent 对话流程
- **持久化**：支持向量存储的保存和加载
- 详细文档：[RAG-GUIDE.md](./RAG-GUIDE.md)

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

创建 `.env` 文件：

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 运行示例

```bash
# 基础开发
pnpm run dev

# 测试 Stdio MCP
pnpm run test:stdio-mcp

# 测试 HTTP MCP
pnpm run test:http-mcp

# RAG 单元测试（推荐首先运行）
pnpm run test:rag-unit

# 测试 RAG（基础示例）
pnpm run test:rag

# 测试 RAG（文件索引）
pnpm run test:rag-file

# 测试完整集成
pnpm run test:complete
```

## 📖 文档

- [MCP 使用指南](./MCP-GUIDE.md) - MCP 协议集成说明
- [RAG 使用指南](./RAG-GUIDE.md) - RAG 功能详细文档
- [快速上手指南](./QUICK-START.md) - 5 分钟快速开始
- [测试指南](./TEST-GUIDE.md) - 测试 RAG 功能
- [架构文档](./RAG-ARCHITECTURE.md) - 技术架构说明
- [HTTP MCP 指南](./HTTP-MCP-GUIDE.md) - HTTP MCP 服务器配置

## 🏗️ 项目结构

```
.
├── src/
│   ├── agent.ts              # Agent 核心类
│   ├── chat-open-ai.ts       # OpenAI 封装
│   ├── stdio_mcp/            # Stdio MCP 实现
│   ├── http_mcp/             # HTTP MCP 实现
│   ├── rag/                  # RAG 模块
│   │   ├── types.ts          # 类型定义
│   │   ├── embedding.ts      # 向量化
│   │   ├── vector-store.ts   # 向量存储
│   │   ├── document-processor.ts  # 文档处理
│   │   ├── rag-retriever.ts  # RAG 检索器
│   │   └── index.ts          # 模块导出
│   └── examples/             # 示例代码
│       ├── rag-example.ts         # RAG 基础示例
│       └── rag-file-example.ts    # RAG 文件索引示例
├── package.json
└── tsconfig.json
```

## 💡 使用示例

### 基础 Agent 使用

```typescript
import { Agent } from "./src/agent.js";

const agent = await Agent.create({
    model: "gpt-4o-mini",
    systemPrompt: "你是一个有用的助手",
});

const answer = await agent.chat("你好！");
console.log(answer);

await agent.disconnect();
```

### 集成 RAG

```typescript
import { Agent } from "./src/agent.js";
import { RAGRetriever } from "./src/rag/index.js";

// 1. 创建 RAG 检索器
const ragRetriever = new RAGRetriever({
    apiKey: process.env.OPENAI_API_KEY,
    topK: 3,
});

// 2. 索引文档
await ragRetriever.indexDocuments("./docs");

// 3. 创建带 RAG 的 Agent
const agent = await Agent.create({
    model: "gpt-4o-mini",
    ragRetriever,
    enableRAG: true,
});

// 4. 对话（自动检索相关文档）
const answer = await agent.chat("文档中提到了什么？");

await agent.disconnect();
```

### 集成 MCP 服务器

```typescript
import { Agent } from "./src/agent.js";

const agent = await Agent.create({
    mcpServers: [
        {
            name: "my-mcp",
            type: "stdio",
            command: "node",
            args: ["./mcp-server.js"],
        },
    ],
});

// Agent 自动发现并可以调用 MCP 工具
const answer = await agent.chat("调用工具完成任务");

await agent.disconnect();
```

## 🛠️ 技术栈

- **TypeScript** - 类型安全
- **Node.js** - 运行时（ESM 模块）
- **OpenAI API** - LLM 和 Embeddings
- **MCP SDK** - Model Context Protocol
- **tsx** - TypeScript 执行器

## 📦 依赖

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.25.3",
    "chalk": "^5.6.2",
    "dotenv": "^17.2.3",
    "openai": "^6.17.0"
  },
  "devDependencies": {
    "@types/node": "^22.13.11",
    "ts-node": "^10.9.2",
    "tsx": "^4.19.3",
    "typescript": "^5.8.2"
  }
}
```

## 🎯 适用场景

- **知识库问答系统** - 使用 RAG 索引企业文档
- **智能客服** - 集成 MCP 工具调用
- **文档助手** - 自动检索和回答文档相关问题
- **代码助手** - 索引代码库提供智能建议
- **AI Agent 开发** - 快速构建自定义 Agent

## 🔧 开发

### 构建

```bash
pnpm run build
```

### 运行

```bash
pnpm run start
```

### 开发模式

```bash
pnpm run dev
```

## 🧪 测试

### 运行 RAG 单元测试

```bash
pnpm run test:rag-unit
```

**测试覆盖：**
- ✅ EmbeddingModel 向量化（3 个测试）
- ✅ DocumentProcessor 文档处理（2 个测试）
- ✅ VectorStore 存储和检索（2 个测试）
- ✅ RAGRetriever 完整流程（2 个测试）
- ✅ 相似度排序验证（1 个测试）

**预期结果：** 10/10 测试通过，成功率 100%

详细信息请查看 [测试指南](./TEST-GUIDE.md)

## 📄 许可

ISC

## 🤝 贡献

欢迎提交 Issue 和 PR！