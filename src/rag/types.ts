/**
 * RAG 模块的类型定义
 */

/**
 * 文档接口
 */
export interface Document {
    id: string;
    content: string;
    metadata: {
        source: string;
        timestamp: number;
        chunkIndex?: number;
        totalChunks?: number;
        [key: string]: any;
    };
}

/**
 * 向量化后的文档
 */
export interface VectorDocument extends Document {
    embedding: number[];
}

/**
 * 检索结果
 */
export interface RetrievalResult {
    document: Document;
    score: number; // 相似度分数
}

/**
 * RAG 配置选项
 */
export interface RAGOptions {
    embeddingModel?: string; // 嵌入模型（默认 text-embedding-v2 阿里百炼），也可用 OPENAI_EMBEDDING_MODEL 环境变量
    topK?: number; // 默认检索文档数量
    chunkSize?: number; // 文档分块大小（字符数）
    chunkOverlap?: number; // 分块重叠大小
}

/**
 * 文档加载选项
 */
export interface LoadDocumentOptions {
    recursive?: boolean; // 是否递归加载子目录
    extensions?: string[]; // 支持的文件扩展名
}
