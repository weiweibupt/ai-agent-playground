/**
 * Skill 文件解析器
 * 解析 SKILL.md 文件，提取 frontmatter 元数据和内容
 */

import type { SkillMetadata, ParsedSkill } from "./types.js";

/**
 * 解析 SKILL.md 文件内容
 * 支持 YAML frontmatter 格式
 * 
 * @param fileContent 文件内容
 * @returns 解析后的 skill 对象
 */
export function parseSkillFile(fileContent: string): ParsedSkill {
    const trimmedContent = fileContent.trim();
    
    // 检查是否有 frontmatter
    if (!trimmedContent.startsWith("---")) {
        throw new Error("Skill 文件必须包含 frontmatter（以 --- 开头）");
    }

    // 提取 frontmatter 和内容
    const parts = trimmedContent.split(/^---$/m);
    
    if (parts.length < 3) {
        throw new Error("Skill 文件格式错误：frontmatter 必须以 --- 包裹");
    }

    // parts[0] 是空字符串（--- 之前）
    // parts[1] 是 frontmatter 内容
    // parts[2] 及之后是 markdown 内容
    const frontmatterText = parts[1].trim();
    const content = parts.slice(2).join("---").trim();

    // 解析 frontmatter（简单的 YAML 解析）
    const metadata = parseFrontmatter(frontmatterText);

    // 验证必需字段
    if (!metadata.name) {
        throw new Error("Skill 文件缺少必需字段: name");
    }
    if (!metadata.description) {
        throw new Error("Skill 文件缺少必需字段: description");
    }

    return {
        metadata,
        content,
        fullContent: fileContent,
    };
}

/**
 * 简单的 YAML frontmatter 解析器
 * 支持基础的 key: value 格式和数组
 * 
 * @param yamlText YAML 文本
 * @returns 解析后的元数据对象
 */
function parseFrontmatter(yamlText: string): SkillMetadata {
    const lines = yamlText.split("\n");
    const metadata: any = {};
    let currentKey: string | null = null;
    let currentArray: string[] = [];

    for (let line of lines) {
        line = line.trim();
        
        // 跳过空行和注释
        if (!line || line.startsWith("#")) {
            continue;
        }

        // 检查是否是数组项
        if (line.startsWith("-")) {
            const value = line.substring(1).trim();
            // 移除引号
            const cleanValue = value.replace(/^["']|["']$/g, "");
            currentArray.push(cleanValue);
            continue;
        }

        // 如果之前在处理数组，现在遇到新的 key，保存数组
        if (currentKey && currentArray.length > 0) {
            metadata[currentKey] = currentArray;
            currentArray = [];
            currentKey = null;
        }

        // 解析 key: value
        const colonIndex = line.indexOf(":");
        if (colonIndex === -1) {
            continue;
        }

        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();

        // 检查值是否为空（表示后面可能是数组）
        if (!value) {
            currentKey = key;
            continue;
        }

        // 移除引号
        value = value.replace(/^["']|["']$/g, "");

        metadata[key] = value;
    }

    // 处理最后一个数组
    if (currentKey && currentArray.length > 0) {
        metadata[currentKey] = currentArray;
    }

    return metadata as SkillMetadata;
}

/**
 * 验证 skill 名称是否合法
 * 只允许字母、数字、连字符和下划线
 * 
 * @param name skill 名称
 * @returns 是否合法
 */
export function isValidSkillName(name: string): boolean {
    return /^[a-zA-Z0-9_-]+$/.test(name);
}
