/**
 * 快速测试 - 3 分钟验证 RAG 是否工作
 */

import { RAGRetriever } from "../rag/index.js";
import dotenv from "dotenv";

dotenv.config();

async function quickTest() {
    console.log("⚡ RAG 快速测试（约 30 秒）\n");

    // 检查环境变量
    if (!process.env.OPENAI_API_KEY) {
        console.error("❌ 错误: 未设置 OPENAI_API_KEY");
        console.error("请在 .env 文件中添加: OPENAI_API_KEY=你的密钥\n");
        process.exit(1);
    }

    try {
        // 1. 创建 RAG 检索器（会自动使用 OPENAI_BASE_URL、OPENAI_EMBEDDING_MODEL）
        console.log("1️⃣  创建 RAG 检索器...");
        const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-v2";
        if (process.env.OPENAI_BASE_URL) {
            console.log(`   使用自定义 API: ${process.env.OPENAI_BASE_URL}`);
            console.log(`   嵌入模型: ${embeddingModel}（阿里百炼）`);
        }
        const retriever = new RAGRetriever({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL,
            embeddingModel,
            topK: 2,
        });
        console.log("   ✅ 创建成功\n");

        // 2. 添加测试文档
        console.log("2️⃣  添加测试文档...");
        await retriever.addDocuments([
            {
                id: "test-1",
                content: "北京是中国的首都，拥有悠久的历史文化。",
                metadata: { source: "beijing.txt", timestamp: Date.now() },
            },
            {
                id: "test-2",
                content: "上海是中国的经济中心，有着现代化的城市风貌。",
                metadata: { source: "shanghai.txt", timestamp: Date.now() },
            },
        ]);
        console.log("   ✅ 添加成功\n");

        // 3. 测试检索
        console.log("3️⃣  测试检索...");
        const query = "中国的首都是哪里？";
        console.log(`   查询: ${query}`);
        
        const results = await retriever.retrieve(query, 1);
        
        if (results.length > 0) {
            console.log(`   ✅ 检索成功`);
            console.log(`   相似度: ${results[0].score.toFixed(4)}`);
            console.log(`   文档: ${results[0].document.content}\n`);
        } else {
            console.log("   ❌ 检索失败：未找到结果\n");
            process.exit(1);
        }

        // 4. 验证相关性
        console.log("4️⃣  验证相关性...");
        const topDoc = results[0].document.content;
        
        if (topDoc.includes("北京") || topDoc.includes("首都")) {
            console.log("   ✅ 检索结果正确相关\n");
        } else {
            console.log("   ⚠️  检索结果可能不够相关\n");
        }

        // 5. 测试完成
        console.log("=".repeat(50));
        console.log("🎉 快速测试通过！RAG 功能正常！");
        console.log("=".repeat(50));
        console.log("\n💡 下一步:");
        console.log("   - 运行完整测试: pnpm run test:rag-unit");
        console.log("   - 查看示例: pnpm run test:rag");
        console.log("   - 阅读文档: README.md\n");

    } catch (error) {
        console.error("\n❌ 测试失败:");
        console.error(error);
        console.error("\n💡 请检查:");
        console.error("   1. OPENAI_API_KEY 是否正确");
        console.error("   2. 网络连接是否正常");
        console.error("   3. 是否有足够的 API 配额\n");
        process.exit(1);
    }
}

quickTest();
