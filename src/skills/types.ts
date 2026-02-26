/**
 * Skill 模块类型定义
 */

/**
 * Skill 元数据（从 frontmatter 解析）
 */
export interface SkillMetadata {
    name: string;                // skill 名称
    description: string;         // 简短描述
    triggers?: string[];         // 触发关键词（可选）
    version?: string;            // 版本号（可选）
}

/**
 * 完整的 Skill 对象
 */
export interface Skill extends SkillMetadata {
    content: string;             // 完整内容（不含 frontmatter）
    fullContent: string;         // 包含 frontmatter 的原始内容
    path: string;                // 文件路径
    lastModified: Date;          // 最后修改时间
}

/**
 * Skill 解析结果
 */
export interface ParsedSkill {
    metadata: SkillMetadata;
    content: string;
    fullContent: string;
}
