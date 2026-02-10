/**
 * 文档处理器
 * 负责加载文档和文档分块
 */

import fs from "fs";
import path from "path";
import { Document, LoadDocumentOptions } from "./types.js";

export class DocumentProcessor {
    private chunkSize: number;
    private chunkOverlap: number;

    constructor(chunkSize: number = 1000, chunkOverlap: number = 200) {
        this.chunkSize = chunkSize;
        this.chunkOverlap = chunkOverlap;
    }

    /**
     * 从文件或目录加载文档
     */
    async loadDocuments(
        sourcePath: string,
        options: LoadDocumentOptions = {}
    ): Promise<Document[]> {
        const {
            recursive = true,
            extensions = [".txt", ".md", ".json"],
        } = options;

        const documents: Document[] = [];
        const stats = fs.statSync(sourcePath);

        if (stats.isFile()) {
            // 加载单个文件
            const doc = await this.loadFile(sourcePath);
            if (doc) documents.push(doc);
        } else if (stats.isDirectory()) {
            // 加载目录
            const files = this.getFiles(sourcePath, recursive, extensions);
            for (const filePath of files) {
                const doc = await this.loadFile(filePath);
                if (doc) documents.push(doc);
            }
        }

        return documents;
    }

    /**
     * 加载单个文件
     */
    private async loadFile(filePath: string): Promise<Document | null> {
        try {
            const content = fs.readFileSync(filePath, "utf-8");
            const ext = path.extname(filePath);

            // 根据文件类型处理内容
            let processedContent = content;
            if (ext === ".json") {
                // JSON 文件格式化
                try {
                    const json = JSON.parse(content);
                    processedContent = JSON.stringify(json, null, 2);
                } catch {
                    processedContent = content;
                }
            }

            return {
                id: this.generateId(filePath),
                content: processedContent,
                metadata: {
                    source: filePath,
                    timestamp: Date.now(),
                    extension: ext,
                },
            };
        } catch (error) {
            console.error(`[DocumentProcessor] 加载文件失败: ${filePath}`, error);
            return null;
        }
    }

    /**
     * 递归获取目录中的所有文件
     */
    private getFiles(
        dir: string,
        recursive: boolean,
        extensions: string[]
    ): string[] {
        const files: string[] = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory() && recursive) {
                files.push(...this.getFiles(fullPath, recursive, extensions));
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name);
                if (extensions.includes(ext)) {
                    files.push(fullPath);
                }
            }
        }

        return files;
    }

    /**
     * 将文档分块
     */
    splitDocuments(documents: Document[]): Document[] {
        const chunks: Document[] = [];

        for (const doc of documents) {
            const docChunks = this.splitText(doc.content);

            docChunks.forEach((chunkContent, index) => {
                chunks.push({
                    id: `${doc.id}_chunk_${index}`,
                    content: chunkContent,
                    metadata: {
                        ...doc.metadata,
                        chunkIndex: index,
                        totalChunks: docChunks.length,
                        originalDocId: doc.id,
                    },
                });
            });
        }

        return chunks;
    }

    /**
     * 分割文本
     * 使用滑动窗口策略，保持语义连贯性
     */
    private splitText(text: string): string[] {
        if (text.length <= this.chunkSize) {
            return [text];
        }

        const chunks: string[] = [];
        let start = 0;

        while (start < text.length) {
            let end = start + this.chunkSize;

            // 如果不是最后一块，尝试在句子边界处断开
            if (end < text.length) {
                // 寻找最近的句子结束符
                const sentenceEnd = this.findSentenceEnd(text, end);
                if (sentenceEnd > start) {
                    end = sentenceEnd;
                }
            }

            chunks.push(text.slice(start, end).trim());

            // 移动窗口，考虑重叠
            start = end - this.chunkOverlap;
            if (start < 0) start = 0;
        }

        return chunks;
    }

    /**
     * 查找句子结束位置
     */
    private findSentenceEnd(text: string, position: number): number {
        const sentenceEnders = ["。", "！", "？", ".", "!", "?", "\n\n"];
        let bestPos = position;
        let bestDist = Infinity;

        for (const ender of sentenceEnders) {
            const pos = text.lastIndexOf(ender, position);
            const dist = position - pos;

            if (pos > 0 && dist < bestDist) {
                bestPos = pos + ender.length;
                bestDist = dist;
            }
        }

        return bestPos;
    }

    /**
     * 生成文档 ID
     */
    private generateId(filePath: string): string {
        return Buffer.from(filePath).toString("base64").slice(0, 16);
    }
}
