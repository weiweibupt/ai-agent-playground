/**
 * Skills 功能单元测试
 * 不依赖 OpenAI API，只测试 SkillManager 核心功能
 */

import { SkillManager } from "../skills/index.js";
import { parseSkillFile, isValidSkillName } from "../skills/skill-parser.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试计数器
let totalTests = 0;
let passedTests = 0;

function test(name: string, fn: () => void | Promise<void>) {
    totalTests++;
    return async () => {
        try {
            await fn();
            console.log(`✅ ${name}`);
            passedTests++;
        } catch (error) {
            console.error(`❌ ${name}`);
            console.error(`   错误: ${error instanceof Error ? error.message : String(error)}`);
        }
    };
}

// 测试 1: 解析 skill 文件
const testParseSkillFile = test("解析 skill 文件", () => {
    const sampleContent = `---
name: test-skill
description: 这是一个测试 skill
triggers:
  - 测试
  - test
version: 1.0.0
---

# Test Skill

这是测试内容。`;

    const parsed = parseSkillFile(sampleContent);
    
    if (parsed.metadata.name !== "test-skill") {
        throw new Error(`名称解析错误: ${parsed.metadata.name}`);
    }
    if (parsed.metadata.description !== "这是一个测试 skill") {
        throw new Error(`描述解析错误: ${parsed.metadata.description}`);
    }
    if (!parsed.metadata.triggers || parsed.metadata.triggers.length !== 2) {
        throw new Error(`触发词解析错误`);
    }
    if (!parsed.content.includes("# Test Skill")) {
        throw new Error(`内容解析错误`);
    }
});

// 测试 2: 解析缺少必需字段的 skill 文件
const testParseMissingFields = test("解析缺少必需字段的文件应抛出错误", () => {
    const invalidContent = `---
name: test-skill
---

# Test`;

    try {
        parseSkillFile(invalidContent);
        throw new Error("应该抛出错误但没有");
    } catch (error) {
        if (!(error instanceof Error) || !error.message.includes("缺少必需字段")) {
            throw new Error(`错误信息不正确: ${error}`);
        }
    }
});

// 测试 3: 验证 skill 名称
const testValidSkillName = test("验证 skill 名称", () => {
    if (!isValidSkillName("valid-skill-name")) {
        throw new Error("合法名称被拒绝");
    }
    if (!isValidSkillName("valid_skill_123")) {
        throw new Error("合法名称被拒绝");
    }
    if (isValidSkillName("invalid skill")) {
        throw new Error("非法名称（包含空格）被接受");
    }
    if (isValidSkillName("invalid@skill")) {
        throw new Error("非法名称（包含特殊字符）被接受");
    }
});

// 测试 4: SkillManager 加载 skills
const testSkillManagerLoad = test("SkillManager 加载 skills", async () => {
    const skillsDir = path.join(__dirname, "../../SKILL");
    const skillManager = new SkillManager({
        skillsDirectory: skillsDir,
    });

    await skillManager.loadSkills();

    if (!skillManager.isLoaded()) {
        throw new Error("Skills 未加载");
    }

    const count = skillManager.getSkillsCount();
    if (count !== 3) {
        throw new Error(`期望加载 3 个 skills，实际加载了 ${count} 个`);
    }

    const skillsList = skillManager.getSkillsList();
    const skillNames = skillsList.map(s => s.name).sort();
    const expectedNames = ["calculator", "translator", "weather"];
    
    if (JSON.stringify(skillNames) !== JSON.stringify(expectedNames)) {
        throw new Error(`Skill 名称不匹配: ${skillNames.join(", ")}`);
    }
});

// 测试 5: SkillManager 读取 skill
const testSkillManagerRead = test("SkillManager 读取 skill", async () => {
    const skillsDir = path.join(__dirname, "../../SKILL");
    const skillManager = new SkillManager({
        skillsDirectory: skillsDir,
    });

    await skillManager.loadSkills();

    const content = skillManager.readSkill("calculator");
    
    if (!content.includes("Calculator Skill")) {
        throw new Error("内容不包含预期文本");
    }
    if (!content.includes("name: calculator")) {
        throw new Error("内容不包含 frontmatter");
    }
});

// 测试 6: SkillManager 读取不存在的 skill
const testSkillManagerReadNonExistent = test("读取不存在的 skill 应抛出错误", async () => {
    const skillsDir = path.join(__dirname, "../../SKILL");
    const skillManager = new SkillManager({
        skillsDirectory: skillsDir,
    });

    await skillManager.loadSkills();

    try {
        skillManager.readSkill("non-existent");
        throw new Error("应该抛出错误但没有");
    } catch (error) {
        if (!(error instanceof Error) || !error.message.includes("不存在")) {
            throw new Error(`错误信息不正确: ${error}`);
        }
    }
});

// 测试 7: SkillManager 生成工具定义
const testSkillManagerToolDefinition = test("SkillManager 生成工具定义", async () => {
    const skillsDir = path.join(__dirname, "../../SKILL");
    const skillManager = new SkillManager({
        skillsDirectory: skillsDir,
    });

    await skillManager.loadSkills();

    const tool = skillManager.getReadSkillTool();
    
    if (tool.type !== "function") {
        throw new Error("工具类型错误");
    }
    if (tool.function.name !== "read_skill") {
        throw new Error("工具名称错误");
    }
    if (!tool.function.parameters) {
        throw new Error("缺少参数定义");
    }
    
    const params = tool.function.parameters as any;
    if (!params.properties?.skillName?.enum) {
        throw new Error("缺少 skillName enum");
    }
    
    const enumValues = params.properties.skillName.enum;
    if (enumValues.length !== 3) {
        throw new Error(`期望 3 个 skill，实际 ${enumValues.length} 个`);
    }
});

// 测试 8: SkillManager 处理不存在的目录
const testSkillManagerNonExistentDir = test("处理不存在的目录", async () => {
    const nonExistentDir = path.join(__dirname, "../../SKILL_NOT_EXIST");
    const skillManager = new SkillManager({
        skillsDirectory: nonExistentDir,
    });

    await skillManager.loadSkills();

    if (skillManager.getSkillsCount() !== 0) {
        throw new Error("不存在的目录应该加载 0 个 skills");
    }
});

// 测试 9: Skills 摘要生成
const testSkillsSummary = test("生成 skills 摘要", async () => {
    const skillsDir = path.join(__dirname, "../../SKILL");
    const skillManager = new SkillManager({
        skillsDirectory: skillsDir,
    });

    await skillManager.loadSkills();

    const summary = skillManager.getSkillsSummary();
    
    if (!summary.includes("calculator")) {
        throw new Error("摘要不包含 calculator");
    }
    if (!summary.includes("translator")) {
        throw new Error("摘要不包含 translator");
    }
    if (!summary.includes("weather")) {
        throw new Error("摘要不包含 weather");
    }
    if (!summary.includes("read_skill")) {
        throw new Error("摘要不包含 read_skill 提示");
    }
});

// 测试 10: 获取单个 skill 元数据
const testGetSkill = test("获取单个 skill 元数据", async () => {
    const skillsDir = path.join(__dirname, "../../SKILL");
    const skillManager = new SkillManager({
        skillsDirectory: skillsDir,
    });

    await skillManager.loadSkills();

    const skill = skillManager.getSkill("calculator");
    
    if (!skill) {
        throw new Error("未找到 calculator skill");
    }
    if (skill.name !== "calculator") {
        throw new Error("名称不匹配");
    }
    if (!skill.path.includes("SKILL.md")) {
        throw new Error("路径不正确");
    }
    if (!skill.lastModified) {
        throw new Error("缺少修改时间");
    }
});

// 运行所有测试
async function runAllTests() {
    console.log("\n🚀 开始 Skills 单元测试\n");
    console.log("========================================");

    await testParseSkillFile();
    await testParseMissingFields();
    await testValidSkillName();
    await testSkillManagerLoad();
    await testSkillManagerRead();
    await testSkillManagerReadNonExistent();
    await testSkillManagerToolDefinition();
    await testSkillManagerNonExistentDir();
    await testSkillsSummary();
    await testGetSkill();

    console.log("========================================");
    console.log(`\n📊 测试结果: ${passedTests}/${totalTests} 通过`);
    
    if (passedTests === totalTests) {
        console.log("✅ 所有测试通过！\n");
        process.exit(0);
    } else {
        console.log(`❌ ${totalTests - passedTests} 个测试失败\n`);
        process.exit(1);
    }
}

runAllTests();
