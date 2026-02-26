/**
 * Agent 类
 * 整合 ChatOpenAI 和 MCP 客户端，实现完整的 Agent 功能
 * 从用户视角来看，就是一问一答。其实中间过程可能因工具调用进行好几轮对话，但是用户只看到最终的回答
 * 1、loop循环：中间过程可能因工具调用进行好几轮对话，但是用户只看到最终的一问一答
 * 2、工具调用：调用 MCP 服务器提供的工具 client.callTool(actualToolName, toolArgs)
 * - 支持连接多个 MCP 服务器
 */



import { ChatOpenAI } from "./chat-open-ai.js";
import { McpClient } from "./stdio_mcp/mcp-client.js";
import { McpHttpClient } from "./http_mcp/mcp-http-client.js";
import { RAGRetriever } from "./rag/index.js";
import { SkillManager } from "./skills/index.js";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

/**
 * MCP 服务器配置 - Stdio 类型
 */
export interface StdioServerConfig {
    name: string;
    type: "stdio";
    command: string;
    args?: string[];
}

/**
 * MCP 服务器配置 - HTTP 类型
 */
export interface HttpServerConfig {
    name: string;
    type: "http";
    url: string;
}

/**
 * MCP 服务器配置联合类型
 */
export type McpServerConfig = StdioServerConfig | HttpServerConfig;

/**
 * Agent 配置选项
 */
export interface AgentOptions {
    model?: string;
    systemPrompt?: string;
    mcpServers?: McpServerConfig[];
    maxIterations?: number; // 最大循环次数，防止无限循环
    ragRetriever?: RAGRetriever; // RAG 检索器（可选）
    ragTopK?: number; // RAG 检索文档数量
    enableRAG?: boolean; // 是否启用 RAG
    skillsDirectory?: string; // skills 目录路径
    enableSkills?: boolean; // 是否启用 skills（默认 true）
}


export class Agent {
    private chatModel: ChatOpenAI;
    private mcpClients: Map<string, McpClient | McpHttpClient> = new Map();
    private maxIterations: number;
    private ragRetriever?: RAGRetriever;
    private ragTopK: number;
    private enableRAG: boolean;
    private skillManager?: SkillManager;

    /**
     * 私有构造函数 - 只能通过 Agent.create() 调用
     * 这确保了 tools 总是在 ChatOpenAI 初始化时就传入
     */
    private constructor(
        chatModel: ChatOpenAI,
        mcpClients: Map<string, McpClient | McpHttpClient>,
        maxIterations: number,
        ragRetriever?: RAGRetriever,
        ragTopK: number = 3,
        enableRAG: boolean = false,
        skillManager?: SkillManager
    ) {
        this.chatModel = chatModel;
        this.mcpClients = mcpClients;
        this.maxIterations = maxIterations;
        this.ragRetriever = ragRetriever;
        this.ragTopK = ragTopK;
        this.enableRAG = enableRAG && !!ragRetriever;
        this.skillManager = skillManager;
    }

    /**
     * 创建 Agent 实例（推荐使用此方法）
     * 这是异步工厂方法，会加载所有工具后再创建完整的 ChatOpenAI 实例
     */
    static async create(options: AgentOptions = {}): Promise<Agent> {
        const maxIterations = options.maxIterations ?? 10;
        const enableSkills = options.enableSkills ?? true;

        //console.log(`[Agent] [create] 1/7 loadMcpTools 开始:::`);
        // 1. 连接 MCP 服务器并加载工具
        const { mcpClients, tools } = await Agent.loadMcpTools(
            options.mcpServers ?? []
        );
        console.log(`tools:::JSON.stringify(tools, null, 2)`);

        // 2. 加载 Skills（如果启用）
        let skillManager: SkillManager | undefined;
        if (enableSkills && options.skillsDirectory) {
            //console.log(`[Agent] [create] 2/7 加载 Skills...`);
            skillManager = new SkillManager({
                skillsDirectory: options.skillsDirectory,
            });
            await skillManager.loadSkills();

            // 将 read_skill 工具添加到工具列表
            if (skillManager.getSkillsCount() > 0) {
                tools.push(skillManager.getReadSkillTool());
                //console.log(`[Agent] [create] 2/7 Skills 加载完成，已添加 read_skill 工具`);
            }
        }

        // 3. 构建完整的 system prompt（包含 skills 摘要）
        let finalSystemPrompt = options.systemPrompt || "";
        if (skillManager && skillManager.getSkillsCount() > 0) {
            const skillsSummary = skillManager.getSkillsSummary();
            finalSystemPrompt = finalSystemPrompt
                ? `${finalSystemPrompt}\n\n${skillsSummary}`
                : skillsSummary;
            //console.log(`[Agent] [create] 3/7 Skills 摘要已添加到 system prompt`);
        }

        // 4. 创建完整的 ChatOpenAI（tools 在构造时传入）
        const chatModel = new ChatOpenAI({
            model: options.model,
            systemPrompt: finalSystemPrompt,
            tools, // ✅ 构造时传入工具列表（包含 MCP 工具和 read_skill）
        });

        //console.log(`[Agent] [create] 4/7 实例化 ChatOpenAI, tools:::`);

        //console.log(`[Agent] [create] 5/7 实例化 Agent, mcpClients:::`);
        // 5. 返回完整初始化的 Agent
        return new Agent(
            chatModel,
            mcpClients,
            maxIterations,
            options.ragRetriever,
            options.ragTopK ?? 3,
            options.enableRAG ?? false,
            skillManager
        );

    }


    /**
     * 加载 MCP 工具（静态方法）
     * @param servers MCP 服务器配置数组
     * @returns MCP 客户端映射和工具列表
     */
    private static async loadMcpTools(
        servers: McpServerConfig[]
    ): Promise<{
        mcpClients: Map<string, McpClient | McpHttpClient>;
        tools: ChatCompletionTool[];
    }> {
        const mcpClients = new Map<string, McpClient | McpHttpClient>();
        const tools: ChatCompletionTool[] = [];

        if (servers.length === 0) {
            return { mcpClients, tools };
        }

        //console.log(`[Agent] [loadMcpTools] 🔌 开始连接 ${servers.length} 个 MCP 服务器...`);

        const failedServers: string[] = [];

        for (const server of servers) {
            try {
                let client: McpClient | McpHttpClient;

                // 根据服务器类型创建不同的客户端
                if (server.type === "http") {
                    //console.log(`[Agent] [loadMcpTools] 1 new McpHttpClient Http MCP 服务器: ${server.name} (${server.url})`);
                    client = new McpHttpClient(server.url);
                } else {
                    //console.log(`[Agent] [loadMcpTools] 1 new McpClient stdio MCP 服务器: ${server.name}`);
                    client = new McpClient(server.command, server.args ?? []);
                }

                await client.connect();
                mcpClients.set(server.name, client);

                //console.log(`[Agent] [loadMcpTools] 2 client.connect`);


                // 获取该服务器提供的工具
                const serverTools = await client.getTools();

                //console.log(`[Agent] [loadMcpTools] 3 client.getTools:::${serverTools.length}个工具`);
                // 转换 MCP 工具格式为 OpenAI 工具格式
                for (const tool of serverTools) {
                    tools.push({
                        type: "function",
                        function: {
                            name: `${server.name}__${tool.name}`, // 添加服务器名前缀避免冲突
                            description: tool.description ?? "",
                            parameters: tool.inputSchema as Record<string, unknown>,
                        },
                    });
                }

                //console.log(`[Agent] [loadMcpTools] 4 所有tools:::${serverTools.length}个工具`);
            } catch (error) {
                failedServers.push(server.name);
                const errorMsg = error instanceof Error ? error.message : String(error);
                console.error(`❌ 连接 MCP 服务器 ${server.name} 失败: ${errorMsg}`);

                // 如果是 HTTP 服务器连接失败，提供额外提示
                if (server.type === "http" && errorMsg.includes("404")) {
                    console.error(`   💡 提示: 请确保 HTTP MCP 服务器已启动`);
                    console.error(`   💡 启动命令: pnpm run mcp:http-server\n`);
                }
            }
        }

        // 显示连接摘要
        const successCount = mcpClients.size;
        const totalCount = servers.length;

        if (successCount > 0) {
            //console.log(`✅ 成功连接 ${successCount}/${totalCount} 个 MCP 服务器`);
        }

        if (failedServers.length > 0) {
            console.warn(`⚠️  失败的服务器: ${failedServers.join(", ")}`);
        }

        if (tools.length > 0) {
            //console.log(`🔧 [debug]所有共加载工具:${tools.length} 个`);
        }

        return { mcpClients, tools };
    }

    /**
     * 执行单轮对话
     * @param userMessage 用户输入
     * @returns 助手最终回复
     */
    async chat(userMessage: string): Promise<string> {
        //console.log(`\n[Agent] [chat] 4/7 用户对话: ${userMessage}`);

        let iteration = 0;
        let lastAssistantMessage = "";

        let enhancedMessage = userMessage;

        // RAG 增强：在第一次调用前检索相关文档
        if (this.enableRAG && this.ragRetriever) {
            //console.log(`[Agent] [chat] 🔍 启用 RAG，正在检索相关文档...`);
            const context = await this.ragRetriever.retrieveContext(
                userMessage,
                this.ragTopK
            );

            if (context) {
                // 如果已经有 skills 上下文，追加 RAG 上下文
                if (enhancedMessage !== userMessage) {
                    enhancedMessage = `${enhancedMessage}\n\n参考以下文档回答问题：\n\n${context}`;
                } else {
                    enhancedMessage = `参考以下文档回答问题：

${context}

---

用户问题: ${userMessage}`;
                }
                //console.log(`[Agent] [chat] ✅ RAG 上下文已添加`);
            } else {
                //console.log(`[Agent] [chat] ⚠️ 未找到相关文档，使用原始问题`);
            }
        }

        // 循环处理，直到没有工具调用或达到最大迭代次数
        while (iteration < this.maxIterations) {
            iteration++;

            // 调用大模型（第一次传 enhancedMessage，后续传 undefined 继续上下文）
            const response = await this.chatModel.chat(
                iteration === 1 ? enhancedMessage : undefined
            );

            // 检查是否有工具调用
            if ("tool_calls" in response && response.tool_calls) {

                //console.log(`\n[Agent] [chat] 助手请求调用工具 ${response.tool_calls.length} 个工具`);

                // 执行所有工具调用
                for (const toolCall of response.tool_calls) {
                    // 检查是否为函数工具调用
                    if (toolCall.type !== "function" || !toolCall.function) {
                        console.warn(`⚠️ 跳过非函数工具调用: ${toolCall.type}`);
                        continue;
                    }

                    const toolName = toolCall.function.name;
                    const toolArgs = JSON.parse(toolCall.function.arguments);

                    //console.log(`[Agent] [chat] 调用工具: ${toolName}` + " &&&&&& " + `参数: ${JSON.stringify(toolArgs, null, 2)}`);

                    try {
                        // 执行工具
                        const toolResult = await this.executeTool(toolName, toolArgs);

                        // 将工具结果添加到上下文
                        this.chatModel.appendToolResult(
                            toolCall.id,
                            JSON.stringify(toolResult)
                        );

                        //console.log(`[Agent] [chat] appendToolResult: messages:::`);

                        // //console.log(`  ↳ 工具执行成功`, JSON.stringify(toolResult));
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        console.error(`  ↳ 工具执行失败: ${errorMessage}`);

                        // 将错误信息添加到上下文
                        this.chatModel.appendToolResult(
                            toolCall.id,
                            JSON.stringify({ error: errorMessage })
                        );
                    }
                }

                // 继续循环，让模型根据工具结果生成回复
                continue;
            }

            // 没有工具调用，获取最终回复
            if (response.content) {
                
                lastAssistantMessage = typeof response.content === "string"
                    ? response.content
                    : response.content.map(part =>
                        part.type === "text" ? part.text : ""
                    ).join("");
                    
                //console.log(`\n[Agent] [chat] 助手不调用工具返回🤖 助手: ${lastAssistantMessage}`);
                break;
            }

            // 如果既没有 content 也没有 tool_calls，说明出现异常
            console.warn("⚠️ 模型返回了空响应");
            break;
        }

        if (iteration >= this.maxIterations) {
            console.warn(`⚠️ 达到最大迭代次数 (${this.maxIterations})，停止循环`);
        }

        return lastAssistantMessage;
    }

    /**
     * 执行工具调用
     * @param toolName 工具名称（格式：serverName__toolName 或 read_skill）
     * @param toolArgs 工具参数
     * @returns 工具执行结果
     */
    private async executeTool(
        toolName: string,
        toolArgs: Record<string, any>
    ): Promise<any> {
        // 处理 read_skill 工具
        if (toolName === "read_skill") {
            if (!this.skillManager) {
                throw new Error("Skills 功能未启用");
            }
            
            const skillName = toolArgs.skillName;
            if (!skillName) {
                throw new Error("缺少参数: skillName");
            }

            const skillContent = this.skillManager.readSkill(skillName);
            //console.log(`[Agent] [executeTool] 读取 skill: ${skillName}`);
            
            return {
                skillName,
                content: skillContent,
            };
        }

        // 解析工具名称，提取服务器名和实际工具名
        const [serverName, actualToolName] = toolName.split("__");

        if (!serverName || !actualToolName) {
            throw new Error(`无效的工具名称格式: ${toolName}`);
        }

        // 获取对应的 MCP 客户端
        const client = this.mcpClients.get(serverName);
        if (!client) {
            throw new Error(`未找到 MCP 服务器: ${serverName}`);
        }

        // 调用 MCP 工具
        const result = await client.callTool(actualToolName, toolArgs);
        //console.log(`[Agent] [executeTool] 5/7 executeTool: ${actualToolName}`);
        return result;
    }

    /**
     * 获取对话历史
     */
    getMessages(): readonly ChatCompletionMessageParam[] {
        return this.chatModel.getMessages();
    }

    /**
     * 清空对话历史
     */
    clearMessages(): void {
        this.chatModel.clearMessages();
    }

    /**
     * 获取 RAG 检索器
     */
    getRAGRetriever(): RAGRetriever | undefined {
        return this.ragRetriever;
    }

    /**
     * 设置 RAG 检索器
     */
    setRAGRetriever(retriever: RAGRetriever): void {
        this.ragRetriever = retriever;
        this.enableRAG = true;
    }

    /**
     * 启用/禁用 RAG
     */
    setEnableRAG(enable: boolean): void {
        this.enableRAG = enable && !!this.ragRetriever;
    }

    /**
     * 获取 SkillManager
     */
    getSkillManager(): SkillManager | undefined {
        return this.skillManager;
    }

    /**
     * 断开所有 MCP 连接
     */
    async disconnect(): Promise<void> {


        //console.log(`[Agent] [disconnect] 7/7 断开所有 MCP 连接`);

        for (const [name, client] of this.mcpClients.entries()) {
            try {
                await client.disconnect();
                //console.log(`[Agent] [disconnect] ✅ 已断开 ${name}`);
            } catch (error) {
                console.error(`❌ 断开 ${name} 失败:`, error);
            }
        }

        this.mcpClients.clear();
    }
}
