/**
 * RAG 检索器
 * 统一的 RAG 接口，整合文档处理、向量化和检索
 */

import { Document, RAGOptions, LoadDocumentOptions, RetrievalResult } from "./types.js";
import { EmbeddingModel } from "./embedding.js";
import { VectorStore } from "./vector-store.js";
import { DocumentProcessor } from "./document-processor.js";

export class RAGRetriever {
    private embeddingModel: EmbeddingModel;
    private vectorStore: VectorStore;
    private documentProcessor: DocumentProcessor;
    private topK: number;

    constructor(options: RAGOptions = {}) {
        const {
            embeddingModel = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-v2",
            topK = 3,
            chunkSize = 1000,
            chunkOverlap = 200,
        } = options;

        // 使用默认值：从环境变量读取 apiKey 和 baseURL
        const apiKey = process.env.OPENAI_API_KEY || "";
        const baseURL = process.env.OPENAI_BASE_URL;

        if (!apiKey) {
            throw new Error("OPENAI_API_KEY 未设置");
        }

        this.embeddingModel = new EmbeddingModel(apiKey, {
            model: embeddingModel,
            baseURL,
        });
        this.vectorStore = new VectorStore(this.embeddingModel);
        this.documentProcessor = new DocumentProcessor(chunkSize, chunkOverlap);
        this.topK = topK;
    }

    /**
     * 从文件或目录加载并索引文档
     */
    async indexDocuments(
        sourcePath: string,
        options: LoadDocumentOptions = {}
    ): Promise<void> {
        console.log(`[RAGRetriever] 开始索引文档: ${sourcePath}`);

        // 1. 加载文档
        const documents = await this.documentProcessor.loadDocuments(
            sourcePath,
            options
        );
        console.log(`[RAGRetriever] 加载了 ${documents.length} 个文档`);

        if (documents.length === 0) {
            console.warn("[RAGRetriever] 未找到任何文档");
            return;
        }

        // 2. 分块
        const chunks = this.documentProcessor.splitDocuments(documents);
        console.log(`[RAGRetriever] 分割成 ${chunks.length} 个文档块`);

        // 3. 向量化并存储
        await this.vectorStore.addDocuments(chunks);

        console.log(`[RAGRetriever] ✅ 文档索引完成`);
    }

    /**
     * 直接添加文档（不分块）
     */
    async addDocuments(documents: Document[]): Promise<void> {
        await this.vectorStore.addDocuments(documents);
    }

    /**
     * 检索相关文档
     */
    async retrieve(query: string, topK?: number): Promise<RetrievalResult[]> {
        const k = topK ?? this.topK;
        console.log(`[RAGRetriever] 检索查询: "${query}" (top ${k})`);

        const results = await this.vectorStore.retrieve(query, k);

        console.log(`[RAGRetriever] 找到 ${results.length} 个相关文档`);
        results.forEach((result, index) => {
            console.log(
                `  ${index + 1}. [相似度: ${result.score.toFixed(4)}] ${result.document.metadata.source}`
            );
        });

        return results;
    }

    /**
     * 检索并格式化为上下文文本
     */
    async retrieveContext(query: string, topK?: number): Promise<string> {
        const results = await this.retrieve(query, topK);

        if (results.length === 0) {
            return "";
        }

        const contextParts = results.map((result, index) => {
            const source = result.document.metadata.source || "未知来源";
            return `[文档 ${index + 1}] (来源: ${source})\n${result.document.content}`;
        });

        return contextParts.join("\n\n---\n\n");
    }

    /**
     * 保存向量存储
     */
    async save(filePath: string): Promise<void> {
        await this.vectorStore.save(filePath);
    }

    /**
     * 加载向量存储
     */
    async load(filePath: string): Promise<void> {
        await this.vectorStore.load(filePath);
    }

    /**
     * 清空所有数据
     */
    clear(): void {
        this.vectorStore.clear();
    }

    /**
     * 获取统计信息
     */
    getStats(): { documentCount: number; topK: number } {
        return {
            documentCount: this.vectorStore.getDocumentCount(),
            topK: this.topK,
        };
    }
}
