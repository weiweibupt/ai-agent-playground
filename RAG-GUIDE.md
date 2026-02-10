# RAG (检索增强生成) 使用指南

## 📖 什么是 RAG？

RAG (Retrieval-Augmented Generation) 是一种结合检索和生成的 AI 技术。它通过检索相关文档来增强大语言模型的回答质量，特别适用于：

- ✅ 知识库问答
- ✅ 文档检索
- ✅ 专业领域问答
- ✅ 私有数据查询

## 🏗️ 架构设计

```
用户查询
    ↓
向量化查询
    ↓
向量检索 (余弦相似度)
    ↓
获取相关文档 (Top K)
    ↓
注入到 Prompt
    ↓
LLM 生成回答
```

## 🚀 快速开始

### 1. 基础使用

```typescript
import { Agent } from "./agent.js";
import { RAGRetriever } from "./rag/index.js";

// 创建 RAG 检索器
const ragRetriever = new RAGRetriever({
    embeddingModel: "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY,
    topK: 3,
    chunkSize: 1000,
    chunkOverlap: 200,
});

// 索引文档
await ragRetriever.indexDocuments("./docs");

// 创建带 RAG 的 Agent
const agent = await Agent.create({
    model: "gpt-4o-mini",
    ragRetriever,
    enableRAG: true,
});

// 对话
const answer = await agent.chat("什么是 MCP？");
```

### 2. 手动添加文档

```typescript
await ragRetriever.addDocuments([
    {
        id: "doc1",
        content: "你的文档内容...",
        metadata: {
            source: "example.txt",
            timestamp: Date.now(),
        },
    },
]);
```

### 3. 保存和加载向量存储

```typescript
// 保存
await ragRetriever.save("./vectors.json");

// 加载
const newRetriever = new RAGRetriever({ /*...*/ });
await newRetriever.load("./vectors.json");
```

## 📝 运行示例

### 示例 1: 基础 RAG 示例

```bash
pnpm run test:rag
```

演示：
- 创建 RAG 检索器
- 添加示例文档
- 使用 RAG 增强对话
- 对比启用/禁用 RAG 的效果

### 示例 2: 文件索引示例

```bash
pnpm run test:rag-file
```

演示：
- 自动创建测试文档
- 索引整个目录
- 测试多个查询
- 保存和加载向量存储

## ⚙️ 配置选项

### RAGOptions

```typescript
interface RAGOptions {
    embeddingModel?: string;      // 嵌入模型，默认 "text-embedding-3-small"
    apiKey?: string;              // OpenAI API Key
    topK?: number;                // 检索文档数量，默认 3
    chunkSize?: number;           // 文档分块大小（字符），默认 1000
    chunkOverlap?: number;        // 分块重叠大小，默认 200
}
```

### AgentOptions (带 RAG)

```typescript
const agent = await Agent.create({
    model: "gpt-4o-mini",
    systemPrompt: "你的系统提示...",
    ragRetriever: ragRetriever,   // RAG 检索器
    ragTopK: 3,                    // 每次检索文档数量
    enableRAG: true,               // 是否启用 RAG
    // ... 其他选项
});
```

## 🔧 核心模块

### 1. RAGRetriever - RAG 检索器

主要接口，整合所有功能：

```typescript
const retriever = new RAGRetriever(options);

// 索引文档
await retriever.indexDocuments("./docs", {
    recursive: true,
    extensions: [".md", ".txt"],
});

// 检索
const results = await retriever.retrieve("查询", 5);

// 检索并格式化为上下文
const context = await retriever.retrieveContext("查询", 3);

// 统计信息
const stats = retriever.getStats();
```

### 2. DocumentProcessor - 文档处理器

负责加载和分块文档：

```typescript
const processor = new DocumentProcessor(chunkSize, chunkOverlap);

// 加载文档
const docs = await processor.loadDocuments("./docs");

// 分块
const chunks = processor.splitDocuments(docs);
```

### 3. EmbeddingModel - 嵌入模型

将文本转换为向量：

```typescript
const embedding = new EmbeddingModel(apiKey, model);

// 单个文本
const vector = await embedding.embedText("文本");

// 批量
const vectors = await embedding.embedBatch(["文本1", "文本2"]);

// 计算相似度
const similarity = EmbeddingModel.cosineSimilarity(vec1, vec2);
```

### 4. VectorStore - 向量存储

存储和检索向量：

```typescript
const store = new VectorStore(embeddingModel);

// 添加文档
await store.addDocuments(documents);

// 检索
const results = await store.retrieve("查询", topK);

// 持久化
await store.save("./vectors.json");
await store.load("./vectors.json");
```

## 📊 文档格式

### Document 接口

```typescript
interface Document {
    id: string;                    // 文档唯一标识
    content: string;               // 文档内容
    metadata: {
        source: string;            // 来源
        timestamp: number;         // 时间戳
        chunkIndex?: number;       // 分块索引
        totalChunks?: number;      // 总分块数
        [key: string]: any;        // 自定义元数据
    };
}
```

## 💡 最佳实践

### 1. 文档分块策略

```typescript
// 短文档（< 500 字）
chunkSize: 500, chunkOverlap: 50

// 中等文档（500-2000 字）
chunkSize: 1000, chunkOverlap: 200

// 长文档（> 2000 字）
chunkSize: 2000, chunkOverlap: 400
```

### 2. 检索数量 (topK)

- 简单问答：`topK: 1-2`
- 一般查询：`topK: 3-5`
- 复杂分析：`topK: 5-10`

### 3. 嵌入模型选择

| 模型 | 维度 | 速度 | 成本 | 适用场景 |
|------|------|------|------|---------|
| text-embedding-3-small | 1536 | 快 | 低 | 开发/测试 |
| text-embedding-3-large | 3072 | 慢 | 高 | 生产/高精度 |

### 4. 系统提示词优化

```typescript
systemPrompt: `你是一个知识库助手。

重要规则：
1. 仅基于提供的文档回答问题
2. 如果文档中没有相关信息，明确说明
3. 引用文档来源时保持准确
4. 保持回答简洁清晰`
```

## 🎯 使用场景

### 场景 1: 项目文档问答

```typescript
// 索引项目文档
await ragRetriever.indexDocuments("./docs", {
    extensions: [".md", ".txt"],
});

// 问答
const answer = await agent.chat("如何配置 MCP 服务器？");
```

### 场景 2: 代码库检索

```typescript
// 索引代码文件
await ragRetriever.indexDocuments("./src", {
    extensions: [".ts", ".js"],
});

// 查询
const answer = await agent.chat("Agent 类有哪些方法？");
```

### 场景 3: 知识库系统

```typescript
// 索引知识库
await ragRetriever.indexDocuments("./knowledge-base");

// 持久化
await ragRetriever.save("./kb-vectors.json");

// 后续加载
await ragRetriever.load("./kb-vectors.json");
```

## 🔍 调试和监控

### 1. 查看检索结果

```typescript
const results = await ragRetriever.retrieve("查询", 3);
results.forEach((r, i) => {
    console.log(`${i + 1}. [${r.score.toFixed(4)}] ${r.document.metadata.source}`);
    console.log(`   ${r.document.content.slice(0, 100)}...`);
});
```

### 2. 统计信息

```typescript
const stats = ragRetriever.getStats();
console.log(`文档数量: ${stats.documentCount}`);
console.log(`检索数量: ${stats.topK}`);
```

### 3. 启用/禁用 RAG

```typescript
agent.setEnableRAG(true);   // 启用
agent.setEnableRAG(false);  // 禁用
```

## 🚧 扩展方向

### 短期优化

1. ✅ 支持更多文件格式（PDF, DOCX）
2. ✅ 添加混合检索（向量 + 关键词）
3. ✅ 实现重排序（Reranking）
4. ✅ 添加缓存机制

### 长期规划

1. ⬜ 集成专业向量数据库（Chroma, Qdrant）
2. ⬜ 支持多模态检索（图片、代码）
3. ⬜ 添加评估指标（检索准确率）
4. ⬜ 实现增量更新

## 📚 参考资料

- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [RAG 论文](https://arxiv.org/abs/2005.11401)
- [向量相似度计算](https://en.wikipedia.org/wiki/Cosine_similarity)

## ❓ 常见问题

### Q1: 如何提高检索准确率？

- 使用更大的嵌入模型（text-embedding-3-large）
- 优化文档分块策略
- 增加检索数量（topK）
- 实现重排序

### Q2: 向量存储文件太大怎么办？

- 使用专业向量数据库
- 压缩向量维度
- 定期清理过期文档

### Q3: 如何处理多语言文档？

- 使用多语言嵌入模型
- 按语言分别索引
- 在查询时指定语言

### Q4: 检索速度太慢？

- 使用批量向量化
- 实现向量索引（ANN）
- 切换到专业向量数据库

## 📞 支持

如有问题，请查看示例代码或提交 Issue。
