# RAG 模块

轻量级的 RAG (Retrieval-Augmented Generation) 实现，用于增强 AI Agent 的知识检索能力。

## 📦 模块结构

```
src/rag/
├── types.ts              # 类型定义
├── embedding.ts          # 文本向量化（OpenAI Embeddings）
├── vector-store.ts       # 内存向量存储
├── document-processor.ts # 文档加载和分块
├── rag-retriever.ts      # RAG 检索器（主接口）
└── index.ts              # 模块导出
```

## 🚀 快速开始

```typescript
import { RAGRetriever } from "./rag/index.js";

// 1. 创建检索器
const retriever = new RAGRetriever({
    apiKey: process.env.OPENAI_API_KEY,
    topK: 3,
});

// 2. 索引文档
await retriever.indexDocuments("./docs");

// 3. 检索
const results = await retriever.retrieve("查询内容");

// 4. 获取格式化的上下文
const context = await retriever.retrieveContext("查询内容");
```

## 🔧 集成到 Agent

```typescript
import { Agent } from "./agent.js";
import { RAGRetriever } from "./rag/index.js";

// 创建带 RAG 的 Agent
const agent = await Agent.create({
    ragRetriever,
    enableRAG: true,
    ragTopK: 3,
});

// Agent 会自动在对话时检索相关文档
const answer = await agent.chat("你的问题");
```

## 📚 核心功能

### 1. 文档处理
- ✅ 支持 `.txt`, `.md`, `.json` 格式
- ✅ 递归加载目录
- ✅ 智能文档分块（保持语义连贯）
- ✅ 可配置的分块大小和重叠

### 2. 向量化
- ✅ 使用 OpenAI Embeddings API
- ✅ 批量向量化优化
- ✅ 余弦相似度计算

### 3. 向量存储
- ✅ 内存存储（快速）
- ✅ JSON 持久化
- ✅ 高效检索（Top-K）

### 4. 检索增强
- ✅ 语义检索
- ✅ 相似度排序
- ✅ 上下文格式化

## 🎯 特点

- **轻量级**: 无需额外数据库，适合快速原型开发
- **易用性**: 简单的 API，几行代码即可集成
- **可扩展**: 模块化设计，易于替换组件
- **类型安全**: 完整的 TypeScript 类型定义

## 📖 更多信息

详细文档请查看: [RAG-GUIDE.md](../../RAG-GUIDE.md)

## 🔄 未来计划

- [ ] 支持更多文件格式（PDF, DOCX）
- [ ] 混合检索（向量 + 关键词）
- [ ] 重排序（Reranking）
- [ ] 集成专业向量数据库
