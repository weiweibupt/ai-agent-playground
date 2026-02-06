import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

/**
 * MCP 客户端类
 * 用于连接和使用 MCP 服务器
 */
export class McpClient {
  private client: Client;
  private transport: StdioClientTransport;

  constructor(serverCommand: string, serverArgs: string[] = []) {
    // 创建 stdio 传输层
    this.transport = new StdioClientTransport({
      command: serverCommand,
      args: serverArgs,
    });

    // 创建客户端
    this.client = new Client(
      {
        name: "my-mcp-client",
        version: "1.0.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {},
        },
      }
    );
  }

  /**
   * 连接到 MCP 服务器
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect(this.transport);
    } catch (error) {
      console.error("❌ 连接 MCP 服务器失败:", error);
      throw error;
    }
  }

  /**
   * 获取服务器提供的工具列表
   */
  async getTools() {
    try {
      const result = await this.client.listTools();
      console.log("🔧 可用工具:", result.tools);
      return result.tools;
    } catch (error) {
      console.error("❌ 获取工具列表失败:", error);
      throw error;
    }
  }

  /**
   * 获取服务器提供的资源列表
   */
  async getResources() {
    try {
      const result = await this.client.listResources();
      console.log("📚 可用资源:", result.resources);
      return result.resources;
    } catch (error) {
      console.error("❌ 获取资源列表失败:", error);
      throw error;
    }
  }

  /**
   * 调用工具
   */
  async callTool(name: string, arguments_: Record<string, any>) {
    try {
      const result = await this.client.callTool({
        name,
        arguments: arguments_,
      });
      console.log(`🚀 工具 ${name} 执行结果:`, result);
      return result;
    } catch (error) {
      console.error(`❌ 调用工具 ${name} 失败:`, error);
      throw error;
    }
  }

  /**
   * 读取资源
   */
  async readResource(uri: string) {
    try {
      const result = await this.client.readResource({ uri });
      console.log(`📖 资源 ${uri} 内容:`, result);
      return result;
    } catch (error) {
      console.error(`❌ 读取资源 ${uri} 失败:`, error);
      throw error;
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.close(); //会触发server那边的 res.on(close)
      console.log("✅ 已断开 MCP 服务器连接");
    } catch (error) {
      console.error("❌ 断开连接失败:", error);
      throw error;
    }
  }
}
