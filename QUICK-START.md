# RAG 快速上手指南

## 🚀 5 分钟快速开始

### 步骤 1: 安装依赖

```bash
pnpm install
```

### 步骤 2: 配置环境变量

创建 `.env` 文件：

```bash
OPENAI_API_KEY=你的_OpenAI_API_密钥
```

### 步骤 3: 运行示例

#### 示例 1: 基础 RAG 演示

```bash
pnpm run test:rag
```

**演示内容：**
- ✅ 创建 RAG 检索器
- ✅ 添加示例文档
- ✅ 使用 RAG 增强对话
- ✅ 对比启用/禁用 RAG 的效果

#### 示例 2: 文件索引演示

```bash
pnpm run test:rag-file
```

**演示内容：**
- ✅ 自动创建测试文档
- ✅ 索引整个目录（支持 `.md`, `.txt`）
- ✅ 测试多个查询
- ✅ 保存和加载向量存储

#### 示例 3: 完整集成演示

```bash
pnpm run test:complete
```

**演示内容：**
- ✅ 构建完整知识库
- ✅ 对比有/无 RAG 的回答差异
- ✅ 测试多个问题
- ✅ 展示统计信息

## 📝 编写你的第一个 RAG 应用

### 1. 创建文件 `my-rag-app.ts`

```typescript
import { Agent } from "./src/agent.js";
import { RAGRetriever } from "./src/rag/index.js";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    // 1. 创建 RAG 检索器
    const ragRetriever = new RAGRetriever({
        apiKey: process.env.OPENAI_API_KEY,
    });

    // 2. 索引你的文档目录
    await ragRetriever.indexDocuments("./你的文档目录");

    // 3. 创建 Agent
    const agent = await Agent.create({
        model: "gpt-4o-mini",
        ragRetriever,
        enableRAG: true,
    });

    // 4. 开始对话
    const answer = await agent.chat("你的问题");
    console.log(answer);

    // 5. 清理
    await agent.disconnect();
}

main().catch(console.error);
```

### 2. 运行你的应用

```bash
tsx my-rag-app.ts
```

## 🎯 常见使用场景

### 场景 1: 项目文档问答

```typescript
// 索引项目文档
await ragRetriever.indexDocuments("./docs");

// 提问
const answer = await agent.chat("如何配置数据库连接？");
```

### 场景 2: 代码库查询

```typescript
// 索引源码
await ragRetriever.indexDocuments("./src", {
    extensions: [".ts", ".js", ".tsx"],
});

// 查询
const answer = await agent.chat("Agent 类有哪些方法？");
```

### 场景 3: 知识库持久化

```typescript
// 首次：索引并保存
await ragRetriever.indexDocuments("./knowledge-base");
await ragRetriever.save("./kb-vectors.json");

// 后续：直接加载
const ragRetriever = new RAGRetriever({ /*...*/ });
await ragRetriever.load("./kb-vectors.json");
```

## ⚙️ 性能优化建议

### 1. 合理设置分块大小

```typescript
// 小文档（< 500 字）
chunkSize: 500, chunkOverlap: 50

// 中等文档
chunkSize: 1000, chunkOverlap: 200

// 大文档
chunkSize: 2000, chunkOverlap: 400
```

### 2. 调整检索数量

```typescript
// 简单问答
ragTopK: 1-2

// 一般查询
ragTopK: 3-5

// 复杂分析
ragTopK: 5-10
```

### 3. 选择合适的嵌入模型

```typescript
// 开发/测试（快速、低成本）
embeddingModel: "text-embedding-3-small"

// 生产（高精度）
embeddingModel: "text-embedding-3-large"
```

## 🐛 常见问题

### Q1: 运行示例时报错 `OPENAI_API_KEY 未设置`

**解决方案：**
1. 创建 `.env` 文件
2. 添加 `OPENAI_API_KEY=你的密钥`
3. 确保文件在项目根目录

### Q2: 索引文档后检索不到结果

**可能原因：**
- 文档内容与查询不相关
- topK 设置太小
- 文档格式不支持

**解决方案：**
- 检查文档内容
- 增加 `ragTopK` 值
- 确认文件扩展名在支持列表中

### Q3: 向量存储文件很大

**解决方案：**
- 使用更小的嵌入模型（small 版本）
- 优化文档分块大小
- 考虑使用专业向量数据库

### Q4: 检索速度慢

**解决方案：**
- 使用批量向量化
- 减少文档数量
- 使用向量存储持久化（避免重复索引）
- 切换到专业向量数据库

## 📚 进阶学习

- **完整文档**: 查看 [RAG-GUIDE.md](./RAG-GUIDE.md)
- **架构设计**: 查看 [src/rag/README.md](./src/rag/README.md)
- **示例代码**: 查看 [src/examples/](./src/examples/)

## 💡 提示

1. 首次运行会调用 OpenAI API，需要稍等片刻
2. 建议先运行 `test:rag` 了解基本流程
3. 可以修改示例代码中的问题来测试不同场景
4. 向量存储文件可以重复使用，无需每次重新索引

## 🎉 下一步

- 尝试索引你自己的文档
- 调整参数优化检索效果
- 集成到你的项目中
- 探索更多高级功能

祝你使用愉快！🚀
