/**
 * ChatOpenAI 类 的作用
 * 1、对大模型调用的封装，this.llm = new OpenAI()
 * 2、和大模型对话 this.llm.chat.completions.create(params)
 * 3、维护对话上下文 messages
 */

import "dotenv/config";
import OpenAI, { type ClientOptions } from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionMessageFunctionToolCall,
  ChatCompletionTool,
} from "openai/resources/chat/completions";


export class ChatOpenAI {
  private llm: OpenAI;
  private model: string;
  private messages: ChatCompletionMessageParam[] = [];
  private tools: ChatCompletionTool[] = [];

  constructor(options?: {
    model?: string;
    systemPrompt?: string;
    tools?: ChatCompletionTool[];
  } & ClientOptions) {
    const opts = options ?? {};
    const { model, systemPrompt, tools, ...rest } = opts;
    this.llm = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
      organization: process.env.OPENAI_ORG_ID,
      project: process.env.OPENAI_PROJECT_ID,
      ...rest,
    });
    //console.log(`[ChatOpenAI] 1 [constructor] new OpenAI`);
    this.model = model ?? "gpt-4o-mini";
    if (systemPrompt) {
      this.messages.push({ role: "system", content: systemPrompt });
    }
    if (tools) {
      this.tools = [...tools];
    }
  }

  /**
   * 调用大模型，维护 messages 上下文（流式响应）
   * @param prompt 可选的用户输入，不传则仅基于现有 messages 继续（如工具调用后继续）
   * @returns 助手消息，可能包含 content 或 tool_calls
   */
  async chat(prompt?: string) {
    
    if (prompt !== undefined && prompt !== "") {
      this.messages.push({ role: "user", content: prompt });
    }

    const params = {
      model: this.model,
      messages: this.messages,
      stream: true,
      ...(this.tools.length > 0 && { tools: this.tools }),
    } as const;
    //console.log(`[ChatOpenAI] [chat] 1 llm.chat messages+tools+model:::`);
    const stream = await this.llm.chat.completions.create(params);


    //console.log(`[ChatOpenAI] [chat] 2 llm返回stream`);
    let content = "";
    // 流式 tool_calls 累积器：index 为下标，同一 tool call 的数据分多块到达需按 index 合并
    const toolCallsAccumulator: Array<
      { id?: string; name?: string; arguments?: string } | undefined
    > = [];

    for await (const chunk of stream) {
      // //console.log("******************chunk***********");
      const delta = chunk.choices[0]?.delta;

      if (delta?.content) {
       // process.stdout.write("【debug】content::"+delta.content+"\n"); // 恢复实时输出
        content += delta.content;
      }

      if (delta?.tool_calls) {
        
        for (const tc of delta.tool_calls) {
          // process.stdout.write("【debug】tool_calls::"+JSON.stringify(tc.function)+"\n"); // 恢复实时输出
          const idx = tc.index;
          toolCallsAccumulator[idx] ??= {};
          const acc = toolCallsAccumulator[idx]!;
          if (tc.id) acc.id = tc.id;
          if (tc.function?.name) acc.name = tc.function.name;
          if (tc.function?.arguments)
            acc.arguments = (acc.arguments ?? "") + tc.function.arguments;
        }
      }
    }
    process.stdout.write("\n");

    const toolCallsList = toolCallsAccumulator.filter(
      (acc): acc is { id?: string; name?: string; arguments?: string } =>
        acc != null
    );
    const toolCallEntries = toolCallsList.length;

    if (!content && toolCallEntries === 0) {
      throw new Error("No message in completion response");
    }

    const message: ChatCompletionMessageParam =
      toolCallEntries > 0
        ? {
            role: "assistant",
            content: content || null,
            tool_calls: toolCallsList.map(
              (acc): ChatCompletionMessageFunctionToolCall => ({
                id: acc.id ?? "",
                type: "function",
                function: {
                  name: acc.name ?? "",
                  arguments: acc.arguments ?? "",
                },
              })
            ),
          }
        : { role: "assistant", content };

        //console.log("[ChatOpenAI] [chat] 3  合并chunk到一条message::",message);
    // 将完整 assistant 消息（含 tool_calls）加入上下文，供后续 chat() 和 appendToolResult 使用
    this.messages.push(message);
    //console.log(`[ChatOpenAI] [chat] 4 维护上下文 messages.push:::${this.messages.length}`);
    return message;
  }

  /**
   * 将工具调用结果追加到对话上下文
   * @param toolCallId 工具调用的唯一标识符
   * @param toolOutput 工具执行返回的结果
   */
  public appendToolResult(toolCallId: string, toolOutput: string) {
    this.messages.push({
      role: "tool",
      tool_call_id: toolCallId,
      content: toolOutput,
    });
    //console.log(`[ChatOpenAI] [appendToolResult] 维护上下文 messages.push:::${this.messages.length}`);
  }

  /** 获取当前对话消息列表（只读） */
  getMessages(): readonly ChatCompletionMessageParam[] {
    return this.messages;
  }

  /** 清空对话上下文 */
  clearMessages() {
    this.messages = [];
  }

  /**
   * 获取当前工具列表（只读）
   */
  getTools(): readonly ChatCompletionTool[] {
    return this.tools;
  }
}
