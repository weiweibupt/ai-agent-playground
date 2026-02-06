import { McpClient } from "./McpClient.js";
import { writeFile } from "fs/promises";
import { join } from "path";

/**
 * MCP 完整演示
 * 展示如何使用 MCP 客户端连接到服务器并调用工具
 */
async function mcpDemo() {
  console.log("🚀 开始 MCP 演示...\n");
  
  // 创建客户端，连接到我们的简单服务器
  // 注意：您需要先在另一个终端运行服务器
  const client = new McpClient("tsx", ["src/stdio_mcp/McpServer.ts"]);
  // const client = new McpClient("uvx", ["mcp-server-fetch"]);

  try {
    // 1. 连接到服务器
    console.log("=== 步骤 1: 连接到 MCP 服务器 ===");
    await client.connect();

    console.log("\n" + "─".repeat(60));

    // 2. 获取可用工具
    console.log("\n=== 步骤 2: 获取可用工具 ===");
    const tools = await client.getTools();

    console.log("\n" + "─".repeat(60));

    // 3. 调用 fetch 工具抓取网页内容
    // console.log("\n=== 步骤 3: 调用 fetch 工具 ===");
    // const fetchResult = await client.callTool("fetch", {
    //   url: "https://news.ycombinator.com/"
    // });
    
    // // 4. 将抓取的内容保存到文件
    // console.log("[debug] 步骤 4: 保存内容到文件");
    // if (fetchResult.content && Array.isArray(fetchResult.content)) {
    //   // 提取所有文本内容
    //   const textContent = fetchResult.content
    //     .filter((item: any) => item.type === "text")
    //     .map((item: any) => item.text)
    //     .join("\n\n");
      
    //   // 生成文件名（使用时间戳）
    //   const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    //   const filename = `fetched-content-${timestamp}.md`;
    //   const filepath = join(process.cwd(), filename);
      
    //   // 写入文件
    //   await writeFile(filepath, textContent, "utf-8");
    //   console.log(`✅ 内容已保存到文件: ${filepath}`);
    // } else {
    //   console.warn("⚠️ 未找到有效的内容数据");
    // }

    // // 4. 调用回显工具
    // console.log("[debug]  步骤 4: 调用回显工具");
    // await client.callTool("echo", {
    //   message: "Hello MCP World! 你好 MCP 世界！"
    // });

    // 5. 获取当前时间
    console.log("[debug] 步骤 5: 获取当前时间");
    await client.callTool("current_time", {});

    // // 6. 演示错误处理
    // console.log("\n❌ 步骤 6: 演示错误处理");
    // try {
    //   await client.callTool("calculator", {
    //     operation: "divide",
    //     a: 10,
    //     b: 0
    //   });
    // } catch (error) {
    //   console.log("✅ 成功捕获除零错误:", (error as Error).message);
    // }

    console.log("\n🎉 MCP 演示完成！");

  } catch (error) {
    console.error("❌ 演示过程中发生错误:", error);
  } finally {
    // 7. 断开连接
    console.log("\n🔌 步骤 7: 断开连接");
    await client.disconnect();
  }
}

// 运行演示
if (import.meta.url === `file://${process.argv[1]}`) {
  mcpDemo().catch(console.error);
}

export { mcpDemo };