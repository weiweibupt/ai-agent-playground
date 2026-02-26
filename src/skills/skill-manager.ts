/**
 * SkillManager - Skill 管理器
 * 负责扫描、加载、管理所有 skills
 */

import fs from "fs/promises";
import path from "path";
import type { Skill, SkillMetadata } from "./types.js";
import { parseSkillFile, isValidSkillName } from "./skill-parser.js";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

export interface SkillManagerOptions {
    skillsDirectory: string;     // skills 根目录
    autoLoad?: boolean;          // 是否自动加载（默认 true）
}

export class SkillManager {
    private skillsDirectory: string;
    private skills: Map<string, Skill> = new Map();
    private loaded: boolean = false;

    constructor(options: SkillManagerOptions) {
        this.skillsDirectory = options.skillsDirectory;
    }

    /**
     * 加载所有 skills
     * 扫描 skillsDirectory 下的所有 SKILL.md 文件
     */
    async loadSkills(): Promise<void> {
        ////////console.log(`[SkillManager] 🔍 开始扫描 skills 目录: ${this.skillsDirectory}`);

        try {
            // 检查目录是否存在
            await fs.access(this.skillsDirectory);
        } catch (error) {
            console.warn(`⚠️ Skills 目录不存在: ${this.skillsDirectory}`);
            this.loaded = true;
            return;
        }

        // 读取目录内容
        const entries = await fs.readdir(this.skillsDirectory, { withFileTypes: true });

        let loadedCount = 0;
        let failedCount = 0;

        for (const entry of entries) {
            // 只处理目录
            if (!entry.isDirectory()) {
                continue;
            }

            const skillDir = path.join(this.skillsDirectory, entry.name);
            const skillFilePath = path.join(skillDir, "SKILL.md");

            try {
                // 检查 SKILL.md 是否存在
                await fs.access(skillFilePath);

                // 读取文件内容
                const fileContent = await fs.readFile(skillFilePath, "utf-8");
                const stats = await fs.stat(skillFilePath);

                // 解析 skill 文件
                const parsed = parseSkillFile(fileContent);

                // 验证 skill 名称
                if (!isValidSkillName(parsed.metadata.name)) {
                    console.warn(`⚠️ 跳过无效的 skill 名称: ${parsed.metadata.name}`);
                    failedCount++;
                    continue;
                }

                // 创建 Skill 对象
                const skill: Skill = {
                    ...parsed.metadata,
                    content: parsed.content,
                    fullContent: parsed.fullContent,
                    path: skillFilePath,
                    lastModified: stats.mtime,
                };

                this.skills.set(skill.name, skill);
                loadedCount++;

                ////////console.log(`  ✅ 加载 skill: ${skill.name}`);
            } catch (error) {
                failedCount++;
                const errorMsg = error instanceof Error ? error.message : String(error);
                
                // 如果是文件不存在，静默跳过
                if (errorMsg.includes("ENOENT")) {
                    continue;
                }
                
                console.error(`  ❌ 加载 skill 失败 (${entry.name}): ${errorMsg}`);
            }
        }

        this.loaded = true;
        ////////console.log(`[SkillManager] ✅ Skills 加载完成: ${loadedCount} 个成功, ${failedCount} 个失败`);
    }

    /**
     * 获取所有 skills 的元数据列表
     */
    getSkillsList(): SkillMetadata[] {
        return Array.from(this.skills.values()).map(skill => ({
            name: skill.name,
            description: skill.description,
            triggers: skill.triggers,
            version: skill.version,
        }));
    }

    /**
     * 生成 skills 摘要（用于 system prompt）
     * 返回格式化的文本，列出所有可用的 skills
     */
    getSkillsSummary(): string {
        if (this.skills.size === 0) {
            return "";
        }

        const lines = [];
        lines.push("## Skills 工作机制");
        lines.push("");
        lines.push("1. **主动调用**: 应优先主动调用 `read_skill` 工具读取该 skill 的完整指南");
        lines.push("2. **触发词参考**: 上面列出的触发词可以帮助你判断何时应该使用某个 skill");
        lines.push("3. **严格遵循**: 读取 skill 指南后，必须严格按照指南中的要求执行任务");
        lines.push("4. **格式规范**: 特别注意 skill 中定义的输出格式，确保输出符合规范");
        lines.push("");
        lines.push("**重要**: 使用 SKILLS 应该优先主动使用 `read_skill` 工具获取详细指南。");

       lines.push(...[
            "有以下 skills 可用：",
        ]);
        
        for (const skill of this.skills.values()) {
            lines.push(`- **${skill.name}**: ${skill.description}`);
            if (skill.triggers && skill.triggers.length > 0) {
                lines.push(`  触发词: ${skill.triggers.join(", ")}`);
            }
        }

        lines.push("");
        
        return lines.join("\n");
    }

    /**
     * 读取指定 skill 的完整内容
     * 
     * @param skillName skill 名称
     * @returns skill 的完整内容
     */
    readSkill(skillName: string): string {
        const skill = this.skills.get(skillName);
        
        if (!skill) {
            throw new Error(`Skill 不存在: ${skillName}`);
        }

        return skill.fullContent;
    }

    /**
     * 获取指定 skill 的元数据
     * 
     * @param skillName skill 名称
     * @returns skill 元数据
     */
    getSkill(skillName: string): Skill | undefined {
        return this.skills.get(skillName);
    }

    /**
     * 生成 read_skill 工具定义（OpenAI 格式）
     * 
     * @returns OpenAI ChatCompletionTool 对象
     */
    getReadSkillTool(): ChatCompletionTool {
        const skillNames = Array.from(this.skills.keys());
        
        return {
            type: "function",
            function: {
                name: "read_skill",
                description: "读取指定 skill 的完整内容和使用说明",
                parameters: {
                    type: "object",
                    properties: {
                        skillName: {
                            type: "string",
                            description: `要读取的 skill 名称。可用的 skills: ${skillNames.join(", ")}`,
                            enum: skillNames,
                        },
                    },
                    required: ["skillName"],
                },
            },
        };
    }

    /**
     * 检查是否已加载 skills
     */
    isLoaded(): boolean {
        return this.loaded;
    }

    /**
     * 获取 skills 数量
     */
    getSkillsCount(): number {
        return this.skills.size;
    }

    /**
     * 重新加载所有 skills
     */
    async reloadSkills(): Promise<void> {
        this.skills.clear();
        this.loaded = false;
        await this.loadSkills();
    }

    /**
     * 根据用户输入匹配相关的 skills
     * 基于 triggers 关键词进行匹配
     * 
     * @param userInput 用户输入
     * @returns 匹配到的 skills 列表（按优先级排序）
     */
    matchSkills(userInput: string): Skill[] {
        const matched: Array<{ skill: Skill; matchCount: number }> = [];
        const lowerInput = userInput.toLowerCase();

        for (const skill of this.skills.values()) {
            // 如果没有 triggers，跳过
            if (!skill.triggers || skill.triggers.length === 0) {
                continue;
            }

            // 统计匹配到的 trigger 数量
            let matchCount = 0;
            for (const trigger of skill.triggers) {
                if (lowerInput.includes(trigger.toLowerCase())) {
                    matchCount++;
                }
            }

            // 如果有匹配，加入结果
            if (matchCount > 0) {
                matched.push({ skill, matchCount });
            }
        }

        // 按匹配数量降序排序（匹配越多，优先级越高）
        matched.sort((a, b) => b.matchCount - a.matchCount);

        return matched.map(m => m.skill);
    }

    /**
     * 生成匹配的 skills 的上下文文本
     * 用于自动注入到用户消息中
     * 
     * @param skills 匹配到的 skills
     * @returns 格式化的上下文文本
     */
    generateSkillsContext(skills: Skill[]): string {
        if (skills.length === 0) {
            return "";
        }

        const lines: string[] = [
            "=== 📚 相关 Skills 指南 ===",
            "",
            "以下是与此任务相关的 skills 使用指南，请严格按照指南中的要求执行：",
            "",
        ];

        for (const skill of skills) {
            lines.push(`--- Skill: ${skill.name} ---`);
            lines.push(skill.content);
            lines.push("");
        }

        lines.push("=== 📚 Skills 指南结束 ===");
        lines.push("");

        return lines.join("\n");
    }
}
