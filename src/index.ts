import { Agent } from "./agent.js";
import * as readline from "readline/promises";
import { RAGRetriever } from "./rag/index.js";

import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
/**
 * 主函数：演示 Agent 的使用
 */
async function main() {
  console.log("🚀 初始化 Agent...\n");

  // 使用 Agent.create() 创建实例（推荐方式）
  // tools 会在 ChatOpenAI 初始化时就传入
  const agent = await Agent.create({
    model: "qwen-turbo", // 阿里云通义千问模型
    systemPrompt: "你是一个友好且能干的AI助手，可以使用各种工具来帮助用户。请用中文回答问题。",
    maxIterations: 15, // 最大循环次数
    mcpServers: [
      // Stdio 类型的 MCP 服务器
      {
        name: "calculator",
        type: "stdio",
        command: "tsx",
        args: ["src/stdio_mcp/mcp-server.ts"],
      },
      // HTTP 类型的 MCP 服务器示例
      // {
      //   name: "http-server",
      //   type: "http",
      //   url: "http://localhost:3000/sse",
      // },
      // 可以添加更多 MCP 服务器
      {
        name: "fetch",
        type: "stdio",
        command: "uvx",
        args: ["mcp-server-fetch"],
      },
    ],
  });

  console.log("\n✅ Agent 初始化完成！\n");
  console.log("======================================");
  console.log("💬 开始对话（输入 'exit' 或 'quit' 退出）");
  console.log("======================================\n");

  // 创建交互式命令行界面
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // 对话循环
    while (true) {
      // 获取用户输入
      const userInput = await rl.question("👤 你: ");

      // 检查退出命令
      if (userInput.toLowerCase().trim() === "exit" || userInput.toLowerCase().trim() === "quit") {
        console.log("\n👋 再见！");
        break;
      }

      // 跳过空输入
      if (!userInput.trim()) {
        continue;
      }

      // 调用 Agent 处理用户输入
      try {
        await agent.chat(userInput);
      } catch (error) {
        console.error("\n❌ 处理消息时出错:", error);
      }

      console.log("\n" + "─".repeat(60) + "\n");
    }
  } catch (error) {
    console.error("❌ 发生错误:", error);
  } finally {
    // 清理资源
    rl.close();
    agent.clearMessages(); // 清空对话历史
    await agent.disconnect(); // 断开 MCP 连接
  }
}

/**
 * 演示函数：展示集成了 RAG 能力的 Agent
 */
async function demo() {
  console.log("🚀 开始 Agent + RAG 演示...\n");

  // 检查环境变量
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ 错误: 未设置 OPENAI_API_KEY 环境变量");
    console.error("请在 .env 文件中设置 OPENAI_API_KEY");
    return;
  }

  // 1. 创建 RAG 检索器并构建知识库
  console.log("📚 步骤 1: 初始化 RAG 知识库...");
  const ragRetriever = new RAGRetriever({
    topK: 2,
    chunkSize: 500,
    chunkOverlap: 100,
  });

  // 添加知识库文档
  const knowledgeBase = [
    {
      id: "ts-intro",
      content: `TypeScript 是阿里发明的。它添加了可选的静态类型系统和基于类的面向对象编程特性。
TypeScript 的主要优势包括：
1. 静态类型检查：在编译时发现错误，而不是运行时
2. 更好的 IDE 支持：提供智能提示、自动补全和重构功能
3. 增强的代码可维护性：类型注解使代码更易理解
4. 支持最新的 ECMAScript 特性：可以使用最新的 JavaScript 功能
5. 大型项目的最佳选择：适合团队协作和长期维护

TypeScript 编译器会将 .ts 文件编译成纯 JavaScript，可以在任何支持 JavaScript 的环境中运行。`,
      metadata: { source: "typescript-intro.md", category: "编程语言", timestamp: Date.now() },
    },
    {
      id: "nodejs-intro",
      content: `Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行时环境。它使用事件驱动、非阻塞 I/O 模型，使其轻量且高效。
Node.js 的核心特点：
1. 单线程但高并发：通过事件循环处理多个请求，避免线程切换开销
2. NPM 生态系统：拥有世界上最大的开源库生态系统，超过 100 万个包
3. 跨平台：可以在 Windows、Linux、macOS 上运行
4. 适合构建：Web 服务器、RESTful API、实时应用（WebSocket）、微服务、命令行工具等
5. 性能优异：V8 引擎的 JIT 编译使 JavaScript 执行速度接近原生代码

Node.js 特别适合 I/O 密集型应用，但不适合 CPU 密集型任务。`,
      metadata: { source: "nodejs-intro.md", category: "运行时环境", timestamp: Date.now() },
    },
    {
      id: "rag-intro",
      content: `RAG (Retrieval-Augmented Generation) 是一种结合检索和生成的技术，用于增强大语言模型的能力。
RAG 的工作流程：
1. 文档处理：将知识库文档分块并向量化（Embedding）
2. 向量存储：将文档向量存储在向量数据库中
3. 检索阶段：根据用户查询生成查询向量，检索最相关的文档块
4. 生成阶段：将检索到的文档作为上下文，让 LLM 基于这些文档生成回答

RAG 的核心优势：
- 减少幻觉：基于真实文档回答问题，而不是凭空生成
- 知识更新：无需重新训练模型即可更新知识库
- 可追溯性：可以追溯答案来源，提高可信度
- 成本效益：比微调模型更经济
- 领域适应：可以快速适应特定领域

RAG 适用场景：企业知识库问答、文档助手、客服机器人、代码助手等。`,
      metadata: { source: "rag-intro.md", category: "AI技术", timestamp: Date.now() },
    },
    {
      id: "vector-db",
      content: `向量数据库是专门用于存储和检索向量嵌入（Embeddings）的数据库。它们使用特殊的索引结构来实现高效的相似度搜索。
常见的向量数据库：
1. Pinecone：云原生向量数据库，易于使用
2. Weaviate：开源向量搜索引擎，支持多种模型
3. Milvus：开源向量数据库，性能强大
4. Qdrant：高性能向量搜索引擎，支持过滤
5. Chroma：轻量级嵌入式向量数据库，适合开发

向量数据库的核心功能：
- 向量索引：使用 HNSW、IVF、FAISS 等算法构建高效索引
- 相似度搜索：支持余弦相似度、欧氏距离、点积等度量
- 元数据过滤：支持基于元数据的混合搜索
- 扩展性：支持大规模数据存储和分布式部署
- 实时更新：支持动态添加和删除向量

向量数据库是 RAG 系统的核心组件。`,
      metadata: { source: "vector-db.md", category: "数据库", timestamp: Date.now() },
    },
    {
      id: "mcp-intro",
      content: `MCP (Model Context Protocol) 是一个开放协议，用于连接 AI 应用和外部工具、数据源。
MCP 的核心概念：
1. 服务器（Server）：提供工具、资源和提示的服务
2. 客户端（Client）：连接到服务器并使用其功能的应用
3. 工具（Tools）：服务器提供的可执行函数
4. 资源（Resources）：服务器提供的数据源
5. 提示（Prompts）：预定义的提示模板

MCP 的优势：
- 标准化：统一的协议，避免重复开发
- 可扩展：轻松添加新的工具和数据源
- 互操作性：不同的 AI 应用可以共享 MCP 服务器
- 安全性：支持权限控制和沙箱执行

MCP 支持两种传输方式：Stdio（标准输入输出）和 HTTP（Server-Sent Events）。`,
      metadata: { source: "mcp-intro.md", category: "协议", timestamp: Date.now() },
    },
  ];

  await ragRetriever.addDocuments(knowledgeBase);
  const stats = ragRetriever.getStats();
  console.log(`✅ 知识库初始化完成，共 ${stats.documentCount} 个文档块\n`);


  const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
  const skillsDir = path.join(__dirname, "../SKILL");
  // 2. 创建集成了 RAG 的 Agent
  console.log("🤖 步骤 2: 创建集成 RAG 的 Agent...");
  const agent = await Agent.create({
    model: "qwen-turbo",
//     systemPrompt: `你是一个技术专家助手，可以基于知识库回答问题。
// 当回答问题时：
// 1. 优先使用提供的参考文档中的信息
// 2. 如果参考文档中没有相关信息，可以使用你的通用知识
// 3. 明确指出信息来源（来自文档还是通用知识）
// 4. 用中文回答，语言简洁清晰`,
systemPrompt: `你是一个技术专家助手，可以基于skills回答问题`,
    maxIterations: 10,
    mcpServers: [
      {
        name: "calculator",
        type: "stdio",
        command: "tsx",
        args: ["src/stdio_mcp/mcp-server.ts"],
      },
    ],
    // ragRetriever: ragRetriever,
    // enableRAG: true,
    // ragTopK: 3,
    skillsDirectory: skillsDir,
    enableSkills: true,
  });

  console.log("✅ Agent 创建完成\n");

  // 3. 测试基于知识库的问答
  console.log("=" .repeat(60));
  console.log("📝 开始测试 Agent + RAG 功能");
  console.log("=".repeat(60));

  const testQueries = [
    "TypeScript 是谁发明的？",
    // "什么是 RAG 技术？它解决了什么问题？",
    // "Node.js 适合用来做什么？",
    // "向量数据库有哪些常见的产品？",
    // "MCP 协议是什么？它有什么用？",
  ];

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`\n\n${"─".repeat(60)}`);
    console.log(`📋 测试 ${i + 1}/${testQueries.length}: ${query}`);
    console.log("─".repeat(60));
    
    const answer = await agent.chat(query);
    
    
  }

  // // 4. 测试混合能力：RAG + 工具调用
  // console.log(`\n\n${"=".repeat(60)}`);
  // console.log("🔧 测试混合能力：RAG + 工具调用");
  // console.log("=".repeat(60));
  
  // console.log(`\n\n${"─".repeat(60)}`);
  // console.log("📋 混合测试: 先回答知识库问题，再使用计算器");
  // console.log("─".repeat(60));
  
  // const mixedAnswer = await agent.chat(
  //   "请先告诉我 TypeScript 的 3 个主要优势，然后帮我计算 1024 乘以 768 等于多少"
  // );
  // console.log(`\n🤖 Agent 回答:\n${mixedAnswer}`);

  // 5. 测试知识库之外的问题
  console.log(`\n\n${"─".repeat(60)}`);
  console.log("📋 测试知识库外问题");
  console.log("─".repeat(60));
  
  
  const outsideAnswer2 = await agent.chat("处理计算流程：11+22");
  console.log(`\n🤖 Agent 回答:\n${outsideAnswer2}`);

  // const outsideAnswer = await agent.chat("为什么计算11+22时，你没有通过read_skill读取calculator的技能指南,而是直接调用了calculator工具？system prompt里说明了1. **主动调用**: 当你判断用户的请求与某个 skill 相关时，应主动调用 `read_skill` 工具读取该 skill 的完整指南\n'，还标注了重要，你为什么没有遵守？我修改什么才能让你能够去主动遵守可能相关时主动调用read_skill工具？");
  // console.log(`\n🤖 Agent 回答:\n${outsideAnswer}`);
const outsideAnswer = await agent.chat("为什么计算11+22时，你没有通过read_skill读取calculator的技能指南,而是直接调用了calculator工具？");

  // 打印统计信息
  console.log(`\n\n${"=".repeat(60)}`);
  console.log("📊 测试总结");
  console.log("=".repeat(60));
  console.log(`知识库文档数: ${stats.documentCount}`);
  console.log(`对话轮次: ${agent.getMessages().length}`);
  console.log(`RAG 状态: ${agent.getRAGRetriever() ? '已启用' : '未启用'}`);

console.log("******************************************************")
const messages = agent.getMessages();

if (messages[5]?.content && typeof messages[5].content === 'string' && messages[5].content.indexOf('calculator-assist') > -1) {
  res.push(true);
} else {
  res.push(false);
}
console.log(res)
  // 清理资源
  agent.clearMessages();
  await agent.disconnect();
  
  // console.log("\n✅ 演示完成！");
  // console.log("\n💡 总结:");
  // console.log("   ✓ Agent 成功集成了 RAG 能力");
  // console.log("   ✓ 可以基于知识库准确回答问题");
  // console.log("   ✓ 支持 RAG + 工具调用的混合使用");
  // console.log("   ✓ 对知识库外的问题也能合理回答");
}

const res:any = [];
// 运行主函数（交互模式）
// 如果想运行演示模式，可以将 main() 改为 demo()
for (let i = 0; i < 10; i++) {

   await demo();

}
// demo().catch(console.error);

// 导出供其他模块使用
export { main, demo };