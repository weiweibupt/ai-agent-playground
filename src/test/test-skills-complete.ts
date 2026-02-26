/**
 * Skills 完整功能测试（包含 MCP 服务器）
 * 测试自动注入功能和格式化输出
 */

import { Agent } from "../agent.js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSkillsWithMCP() {
    console.log("\n========================================");
    console.log("完整测试: Skills + MCP 集成");
    console.log("========================================\n");

    const skillsDir = path.join(__dirname, "../../SKILL");

    // 创建带 skills 和 MCP 的 Agent
    const agent = await Agent.create({
        model: "qwen-turbo",
        systemPrompt: "你是一个有用的助手。",
        skillsDirectory: skillsDir,
        enableSkills: true,
        maxIterations: 10,
        mcpServers: [
            {
                name: "calculator",
                type: "stdio",
                command: "tsx",
                args: ["src/stdio_mcp/mcp-server.ts"],
            },
        ],
    });

    console.log("✅ Agent 创建成功（已集成 skills 和 MCP）\n");

    // 测试 1: 自动注入 calculator skill，按格式输出
    console.log("🧪 测试 1: 计算任务（触发 calculator skill）");
    console.log("用户: 帮我计算 11 + 22\n");
    const answer1 = await agent.chat("帮我计算 11 + 22");
    console.log(`助手:\n${answer1}\n`);
    console.log("---\n");

    // 测试 2: 乘法计算
    console.log("🧪 测试 2: 乘法计算（触发 calculator skill）");
    console.log("用户: 123 乘以 456 等于多少？\n");
    const answer2 = await agent.chat("123 乘以 456 等于多少？");
    console.log(`助手:\n${answer2}\n`);
    console.log("---\n");

    // 测试 3: 复杂表达式
    console.log("🧪 测试 3: 复杂表达式（触发 calculator skill）");
    console.log("用户: 算一下 (100 + 50) * 2\n");
    const answer3 = await agent.chat("算一下 (100 + 50) * 2");
    console.log(`助手:\n${answer3}\n`);
    console.log("---\n");

    // 测试 4: 翻译任务（自动注入 translator skill）
    console.log("🧪 测试 4: 翻译文档（触发 translator skill）");
    console.log("用户: 帮我翻译文档：Artificial Intelligence\n");
    const answer4 = await agent.chat("帮我翻译文档：Artificial Intelligence");
    console.log(`助手:\n${answer4}\n`);
    console.log("---\n");

    // 测试 5: 无触发词的普通对话
    console.log("🧪 测试 5: 普通对话（无 skill 匹配）");
    console.log("用户: 你好，今天心情不错\n");
    const answer5 = await agent.chat("你好，今天心情不错");
    console.log(`助手:\n${answer5}\n`);
    console.log("---\n");

    // 断开连接
    await agent.disconnect();
    console.log("✅ Agent 已断开连接");
}

async function runTests() {
    console.log("\n🚀 开始 Skills 完整功能测试\n");

    try {
        await testSkillsWithMCP();

        console.log("\n========================================");
        console.log("✅ 所有测试完成！");
        console.log("========================================\n");
    } catch (error) {
        console.error("\n❌ 测试失败:", error);
        process.exit(1);
    }
}

runTests();
