import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

/**
 * MCP HTTP 客户端类
 * 用于通过 HTTP/SSE 连接到 MCP 服务器
 */
export class McpHttpClient {
  private client: Client;
  private transport: SSEClientTransport;

  constructor(serverUrl: string) {
    // 创建 SSE 传输层
    this.transport = new SSEClientTransport(new URL(serverUrl));

    // 创建客户端
    this.client = new Client(
      {
        name: "my-mcp-http-client",
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

    // console.log("[MCPHttpClient] [constructor] 1/5 实例化:::", this.client, this.transport);
    console.log("[MCPHttpClient] [constructor] 1/5 实例化:::");
  }

  /**
   * 连接到 MCP 服务器
   */
  async connect(): Promise<void> {
    try {
      await this.client.connect(this.transport);
      console.error("[MCPHttpClient] [connect] 2/5 ✅ 连接 HTTP MCP 服务器成功");

    } catch (error) {
      console.error("[MCPHttpClient] [connect] 2/5 ❌ 连接 HTTP MCP 服务器失败:::", error);
      throw error;
    }
  }

  /**
   * 获取服务器提供的工具列表
   */
  async getTools() {
    try {
      const result = await this.client.listTools();
      console.log("[MCPHttpClient] [getTools] 3/5 🔧 可用工具:::", result.tools);
      return result.tools;
    } catch (error) {
      console.error("[[MCPHttpClient] [getTools] 3/5 ❌ 获取工具列表失败:::", error);
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
      console.log(`[MCPHttpClient] [callTool] 4/5 ✅ 工具 ${name} 执行结果:::`, result);
      return result;
    } catch (error) {
      console.error(`[MCPHttpClient] [callTool] 4/5 ❌ 调用工具 ${name} 失败:::`, error);
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
      await this.client.close(); // 会触发 mcp server 那边的 res.on(close)
      console.log(`[MCPHttpClient] [disconnect] 5/5 ✅ 断开 HTTP MCP 服务器连接`);
    } catch (error) {
      console.error("[MCPHttpClient] [disconnect] 5/5 ❌ 断开连接失败:::", error);
      throw error;
    }
  }
}
