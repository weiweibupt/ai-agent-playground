import { Agent } from "./agent.js";
import * as readline from "readline/promises";

/**
 * 主函数：演示 Agent 的使用
 */
async function main() {
  console.log("🚀 初始化 Agent...\n");

  // 使用 Agent.create() 创建实例（推荐方式）
  // tools 会在 ChatOpenAI 初始化时就传入
  const agent = await Agent.create({
    model: "qwen-turbo", // 阿里云通义千问模型
    systemPrompt: "你是一个友好且能干的AI助手，可以使用各种工具来帮助用户。请用中文回答问题。",
    maxIterations: 15, // 最大循环次数
    mcpServers: [
      // Stdio 类型的 MCP 服务器
      {
        name: "calculator",
        type: "stdio",
        command: "tsx",
        args: ["src/stdio_mcp/mcp-server.ts"],
      },
      // HTTP 类型的 MCP 服务器示例
      // {
      //   name: "http-server",
      //   type: "http",
      //   url: "http://localhost:3000/sse",
      // },
      // 可以添加更多 MCP 服务器
      {
        name: "fetch",
        type: "stdio",
        command: "uvx",
        args: ["mcp-server-fetch"],
      },
    ],
  });

  console.log("\n✅ Agent 初始化完成！\n");
  console.log("======================================");
  console.log("💬 开始对话（输入 'exit' 或 'quit' 退出）");
  console.log("======================================\n");

  // 创建交互式命令行界面
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // 对话循环
    while (true) {
      // 获取用户输入
      const userInput = await rl.question("👤 你: ");

      // 检查退出命令
      if (userInput.toLowerCase().trim() === "exit" || userInput.toLowerCase().trim() === "quit") {
        console.log("\n👋 再见！");
        break;
      }

      // 跳过空输入
      if (!userInput.trim()) {
        continue;
      }

      // 调用 Agent 处理用户输入
      try {
        await agent.chat(userInput);
      } catch (error) {
        console.error("\n❌ 处理消息时出错:", error);
      }

      console.log("\n" + "─".repeat(60) + "\n");
    }
  } catch (error) {
    console.error("❌ 发生错误:", error);
  } finally {
    // 清理资源
    rl.close();
    agent.clearMessages(); // 清空对话历史
    await agent.disconnect(); // 断开 MCP 连接
  }
}

/**
 * 演示函数：展示 Agent 的基本功能
 */
async function demo() {
  console.log("🚀 开始 Agent 演示...\n");

  // 使用 Agent.create() 创建实例（推荐方式）
  const agent = await Agent.create({
    model: "qwen-turbo",
    systemPrompt: "你是一个友好的AI助手，可以使用各种工具。请用中文回答问题。",
    maxIterations: 10,
    mcpServers: [
        // HTTP 类型的 MCP 服务器示例
      {
        name: "http-server",
        type: "http",
        url: "http://localhost:3000/sse",
      },
      {
        name: "my-mcp-server-tools",
        type: "stdio",
        command: "tsx",
        args: ["src/stdio_mcp/mcp-server.ts"],
      },
      
      // 可以添加更多 MCP 服务器
      {
        name: "my-mcp-server-fetch",
        type: "stdio",
        command: "uvx",
        args: ["mcp-server-fetch"],
      },
    ],
  });

//   console.log("\n=== 测试场景 1: 简单对话 ===");
//   const res1 await agent.chat("你好！");
// console.log(`[index] [demo] chat 返回 res:::${JSON.stringify(res1, null, 2)}`)

//   console.log("\n=== 测试场景 2: 使用计算器工具 ===");
//   await agent.chat("帮我计算 123 加 456 等于多少");

//   console.log("\n=== 测试场景 3: 抓取网页 ===");
//   await agent.chat("帮我抓取网页https://httpbin.org/内容并保存在当前目录下的文件里");

  console.log("\n=== 测试场景 4: 一次调用3个工具（并行执行） ===");
  // 这个场景会让 AI 同时调用两个独立的工具
  // 1. 计算器工具：计算数学表达式
  // 2. 获取当前时间工具：获取系统时间
  // 因为这两个操作没有依赖关系，AI 应该能够并行调用它们
  const res4 = await agent.chat("请帮我做3件事：1）计算 999 乘以 888 的结果；2）获取当前的系统时间；3）抓取网页https://httpbin.org/内容并保存在${pocess.cwd()/fetch.md}目录下。");
  console.log(`[index] [demo] chat 返回 res:::${JSON.stringify(res4, null, 2)}`)

 console.log("\n=== 测试场景 2: 使用计算器工具 ===");
  await agent.chat("本来有两个工具可以获取当前时间，你选择了哪个，为什么选择这个而不是另外那个。详细的给出你的决策理由");


  // 打印对话历史
  console.log("\n=== 对话历史 ===");
  const messages = agent.getMessages();
  console.log(`共 ${messages.length} 条消息::`, messages);

  // 清空对话历史
  agent.clearMessages();
  console.log("\n🧹 已清空对话历史");

  // 断开连接
  await agent.disconnect();
  console.log("\n✅ 演示完成！");
}

// 运行主函数（交互模式）
// 如果想运行演示模式，可以将 main() 改为 demo()
demo().catch(console.error);

// 导出供其他模块使用
export { main, demo };