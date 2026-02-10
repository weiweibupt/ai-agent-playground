/**
 * 内存向量存储
 * 使用内存存储向量，支持持久化到 JSON 文件
 */

import fs from "fs";
import { VectorDocument, Document } from "./types.js";
import { EmbeddingModel } from "./embedding.js";

export class VectorStore {
    private documents: VectorDocument[] = [];
    private embeddingModel: EmbeddingModel;

    constructor(embeddingModel: EmbeddingModel) {
        this.embeddingModel = embeddingModel;
    }

    /**
     * 添加文档到向量存储
     */
    async addDocuments(documents: Document[]): Promise<void> {
        console.log(`[VectorStore] 开始向量化 ${documents.length} 个文档...`);

        // 批量向量化（提高效率）
        const contents = documents.map((d) => d.content);
        const embeddings = await this.embeddingModel.embedBatch(contents);

        for (let i = 0; i < documents.length; i++) {
            this.documents.push({
                ...documents[i],
                embedding: embeddings[i],
            });
        }

        console.log(`[VectorStore] ✅ 成功添加 ${documents.length} 个文档`);
    }

    /**
     * 检索最相关的文档
     */
    async retrieve(query: string, topK: number = 5): Promise<Array<{ document: Document; score: number }>> {
        if (this.documents.length === 0) {
            console.warn("[VectorStore] 向量存储为空，无法检索");
            return [];
        }

        // 将查询向量化
        const queryEmbedding = await this.embeddingModel.embedText(query);

        // 计算所有文档的相似度
        const results = this.documents.map((doc) => ({
            document: doc,
            score: EmbeddingModel.cosineSimilarity(queryEmbedding, doc.embedding),
        }));

        // 按相似度排序并返回 top K
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }

    /**
     * 保存向量存储到文件
     */
    async save(filePath: string): Promise<void> {
        try {
            const data = JSON.stringify(this.documents, null, 2);
            fs.writeFileSync(filePath, data, "utf-8");
            console.log(`[VectorStore] ✅ 向量存储已保存到: ${filePath}`);
        } catch (error) {
            console.error("[VectorStore] 保存失败:", error);
            throw error;
        }
    }

    /**
     * 从文件加载向量存储
     */
    async load(filePath: string): Promise<void> {
        try {
            if (!fs.existsSync(filePath)) {
                console.warn(`[VectorStore] 文件不存在: ${filePath}`);
                return;
            }

            const data = fs.readFileSync(filePath, "utf-8");
            this.documents = JSON.parse(data);
            console.log(`[VectorStore] ✅ 从文件加载了 ${this.documents.length} 个文档`);
        } catch (error) {
            console.error("[VectorStore] 加载失败:", error);
            throw error;
        }
    }

    /**
     * 清空向量存储
     */
    clear(): void {
        this.documents = [];
        console.log("[VectorStore] 已清空向量存储");
    }

    /**
     * 获取文档数量
     */
    getDocumentCount(): number {
        return this.documents.length;
    }

    /**
     * 获取所有文档
     */
    getAllDocuments(): Document[] {
        return this.documents.map(({ embedding, ...doc }) => doc);
    }
}
