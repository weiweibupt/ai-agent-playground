/**
 * 文本嵌入（Embedding）模块
 * 使用 OpenAI Embeddings API 将文本转换为向量
 * 支持自定义 baseURL 和 embedding 模型（适配第三方 API 或代理）
 */

import OpenAI from "openai";

export interface EmbeddingModelOptions {
    apiKey: string;
    model?: string; // 默认 text-embedding-v2（阿里百炼），可用 OPENAI_EMBEDDING_MODEL 覆盖
    baseURL?: string; // 默认 undefined（官方 API），可用 OPENAI_BASE_URL 覆盖
}

export class EmbeddingModel {
    private client: OpenAI;
    private model: string;

    constructor(
        apiKey: string,
        modelOrOptions?: string | EmbeddingModelOptions
    ) {
        let model = "text-embedding-v2"; // 阿里百炼嵌入模型
        let baseURL: string | undefined;

        if (typeof modelOrOptions === "string") {
            model = modelOrOptions;
        } else if (modelOrOptions && typeof modelOrOptions === "object") {
            model = modelOrOptions.model ?? process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-v2";
            baseURL = modelOrOptions.baseURL ?? process.env.OPENAI_BASE_URL;
        } else {
            model = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-v2";
            baseURL = process.env.OPENAI_BASE_URL;
        }

        this.model = model;
        this.client = new OpenAI({
            apiKey,
            ...(baseURL && { baseURL }),
        });
    }

    /**
     * 将单个文本转换为向量
     */
    async embedText(text: string): Promise<number[]> {
        try {
            const response = await this.client.embeddings.create({
                model: this.model,
                input: text,
            });

            return response.data[0].embedding;
        } catch (error) {
            console.error("[EmbeddingModel] embedText 失败:", error);
            throw error;
        }
    }

    /**
     * 批量将文本转换为向量
     */
    async embedBatch(texts: string[]): Promise<number[][]> {
        try {
            const response = await this.client.embeddings.create({
                model: this.model,
                input: texts,
            });

            return response.data.map((item) => item.embedding);
        } catch (error) {
            console.error("[EmbeddingModel] embedBatch 失败:", error);
            throw error;
        }
    }

    /**
     * 计算两个向量的余弦相似度
     */
    static cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (vecA.length !== vecB.length) {
            throw new Error("向量维度不匹配");
        }

        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
