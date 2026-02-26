/**
 * Skills 功能测试
 * 测试 SkillManager 和 Agent 的 skills 集成
 */

import { Agent } from "../agent.js";
import { SkillManager } from "../skills/index.js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSkillManager() {
    console.log("\n========================================");
    console.log("测试 1: SkillManager 基础功能");
    console.log("========================================\n");

    const skillsDir = path.join(__dirname, "../../SKILL");
    const skillManager = new SkillManager({
        skillsDirectory: skillsDir,
    });

    // 加载 skills
    await skillManager.loadSkills();

    // 测试获取 skills 列表
    const skillsList = skillManager.getSkillsList();
    console.log(`\n📋 加载的 Skills (${skillsList.length} 个):`);
    for (const skill of skillsList) {
        console.log(`  - ${skill.name}: ${skill.description}`);
        if (skill.triggers) {
            console.log(`    触发词: ${skill.triggers.join(", ")}`);
        }
    }

    // 测试获取 skills 摘要
    console.log("\n📝 Skills 摘要（用于 system prompt）:");
    console.log("---");
    console.log(skillManager.getSkillsSummary());
    console.log("---");

    // 测试读取单个 skill
    console.log("\n📖 测试读取 calculator skill:");
    try {
        const calculatorContent = skillManager.readSkill("calculator");
        console.log(`✅ 成功读取，内容长度: ${calculatorContent.length} 字符`);
        console.log("\n内容预览（前 200 字符）:");
        console.log(calculatorContent.substring(0, 200) + "...");
    } catch (error) {
        console.error("❌ 读取失败:", error);
    }

    // 测试读取不存在的 skill
    console.log("\n🔍 测试读取不存在的 skill:");
    try {
        skillManager.readSkill("non-existent-skill");
        console.error("❌ 应该抛出错误但没有");
    } catch (error) {
        console.log("✅ 正确抛出错误:", (error as Error).message);
    }

    // 测试 read_skill 工具定义
    console.log("\n🔧 read_skill 工具定义:");
    const readSkillTool = skillManager.getReadSkillTool();
    console.log(JSON.stringify(readSkillTool, null, 2));
}

async function testAgentWithSkills() {
    console.log("\n========================================");
    console.log("测试 2: Agent 集成 Skills");
    console.log("========================================\n");

    const skillsDir = path.join(__dirname, "../../SKILL");

    // 创建带 skills 的 Agent
    const agent = await Agent.create({
        model: "qwen-turbo",
        systemPrompt: "你是一个有用的助手。",
        skillsDirectory: skillsDir,
        enableSkills: true,
        maxIterations: 5,
    });

    console.log("\n✅ Agent 创建成功（已集成 skills）\n");

    // 测试 1: 询问可用的 skills
    console.log("🧪 测试对话 1: 询问可用的 skills");
    console.log("用户: 你有哪些 skills？");
    const answer1 = await agent.chat("你有哪些 skills？");
    console.log(`助手: ${answer1}\n`);

    // 测试 2: 自动注入 - 计算任务（包含触发词"计算"）
    console.log("🧪 测试对话 2: 自动注入 calculator skill");
    console.log("用户: 帮我计算 11 + 22");
    console.log("（预期：自动匹配并注入 calculator skill，按格式输出）\n");
    const answer2 = await agent.chat("帮我计算 11 + 22");
    console.log(`助手: ${answer2}\n`);

    // 测试 3: 自动注入 - 翻译任务（包含触发词"翻译"）
    console.log("🧪 测试对话 3: 自动注入 translator skill");
    console.log("用户: 帮我翻译文档：Hello World");
    console.log("（预期：自动匹配并注入 translator skill，按格式输出）\n");
    const answer3 = await agent.chat("帮我翻译文档：Hello World");
    console.log(`助手: ${answer3}\n`);

    // 测试 4: 无匹配 - 不应注入
    console.log("🧪 测试对话 4: 无触发词，不注入 skill");
    console.log("用户: 今天天气真好");
    console.log("（预期：无 skill 匹配，正常对话）\n");
    const answer4 = await agent.chat("今天天气真好");
    console.log(`助手: ${answer4}\n`);

    // 测试 5: 手动读取 skill
    console.log("🧪 测试对话 5: 手动调用 read_skill");
    console.log("用户: 请读取 weather skill 的内容");
    console.log("（预期：调用 read_skill 工具）\n");
    const answer5 = await agent.chat("请读取 weather skill 的内容");
    console.log(`助手: ${answer5.substring(0, 500)}...\n`);

    // 断开连接
    await agent.disconnect();
    console.log("✅ Agent 已断开连接");
}

async function testSkillManagerWithEmptyDirectory() {
    console.log("\n========================================");
    console.log("测试 3: 空目录处理");
    console.log("========================================\n");

    const emptyDir = path.join(__dirname, "../../SKILL_EMPTY");
    const skillManager = new SkillManager({
        skillsDirectory: emptyDir,
    });

    await skillManager.loadSkills();
    console.log(`✅ 空目录处理成功，加载 ${skillManager.getSkillsCount()} 个 skills`);
}

// 运行所有测试
async function runAllTests() {
    console.log("\n🚀 开始 Skills 功能测试\n");

    try {
        // await testSkillManager();
        // await testSkillManagerWithEmptyDirectory();
        await testAgentWithSkills();

        console.log("\n========================================");
        console.log("✅ 所有测试完成！");
        console.log("========================================\n");
    } catch (error) {
        console.error("\n❌ 测试失败:", error);
        process.exit(1);
    }
}

runAllTests();
