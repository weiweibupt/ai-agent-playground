import { Agent } from "../agent.js";

/**
 * 测试 HTTP MCP 客户端
 * 
 * 使用步骤：
 * 1. 先在另一个终端启动 HTTP MCP 服务器：
 *    pnpm run mcp:http-server
 * 
 * 2. 然后运行此测试脚本：
 *    tsx src/test-http-mcp.ts
 */

/**
 * 检查 HTTP 服务器是否可用
 */
async function checkServerHealth(url: string): Promise<boolean> {
  try {
    const healthUrl = url.replace('/sse', '/health');
    const response = await fetch(healthUrl, { 
      method: 'GET',
      signal: AbortSignal.timeout(3000) // 3秒超时
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ HTTP MCP 服务器运行正常: ${JSON.stringify(data)}\n`);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log("🚀 开始测试 HTTP MCP 客户端...\n");

  // 检查 HTTP 服务器是否运行
  const serverUrl = "http://localhost:3000/sse";
  const isServerRunning = await checkServerHealth(serverUrl);
  
  if (!isServerRunning) {
    console.error("❌ HTTP MCP 服务器未运行！");
    console.error("\n📋 请先在另一个终端启动服务器：");
    console.error("   pnpm run mcp:http-server\n");
    console.error("然后再运行此测试脚本。\n");
    process.exit(1);
  }

  // 使用 Agent.create() 创建实例，工具在初始化时就加载
  const agent = await Agent.create({
    model: "qwen-turbo",
    systemPrompt: "你是一个友好的AI助手，可以使用各种工具。请用中文回答问题。",
    maxIterations: 10,
    // 同时连接 Stdio 和 HTTP 类型的 MCP 服务器
    mcpServers: [
      // Stdio 类型：本地计算器服务
      {
        name: "calculator",
        type: "stdio",
        command: "tsx",
        args: ["src/stdio_mcp/mcp-server.ts"],
      },
      // HTTP 类型：HTTP MCP 服务器
      {
        name: "http-server",
        type: "http",
        url: "http://localhost:3000/sse",
      },
    ],
  });

  console.log("\n✅ Agent 初始化完成！\n");
  console.log("=".repeat(60));

  // 测试场景 1: 使用 HTTP 服务器的问候工具
  console.log("\n=== 测试场景 1: 使用 HTTP 服务器的问候工具 ===");
  await agent.chat("请用问候工具向'小明'问好");

  console.log("\n" + "─".repeat(60));

  // // 测试场景 2: 使用 HTTP 服务器获取时间
  // console.log("\n=== 测试场景 2: 获取当前时间 ===");
  // await agent.chat("现在几点了？");

  // console.log("\n" + "─".repeat(60));

  // // 测试场景 3: 使用 Stdio 服务器的计算器
  // console.log("\n=== 测试场景 3: 使用计算器工具 ===");
  // await agent.chat("帮我计算 456 加 789");

  // console.log("\n" + "─".repeat(60));

  // 测试场景 4: 混合使用多个服务器的工具
  console.log("\n=== 测试场景 4: 混合使用多个工具 ===");
  await agent.chat("帮我计算 100 加 200，并且告诉我现在的时间");

  console.log("\n" + "=".repeat(60));

  // 打印对话历史
  console.log("\n=== 对话历史 ===");
  const messages = agent.getMessages();
  console.log(`[index] 共 ${messages.length} 条消息,message:::`, messages);

  // 断开连接
  await agent.disconnect();
  console.log("\n✅ 测试完成！");
}

// 运行测试
main().catch((error) => {
  console.error("❌ 测试失败:", error);
  process.exit(1);
});
