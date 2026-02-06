import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * 简单的 MCP 服务器示例
 * 提供一些基本的工具功能
 */
export class SimpleServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "simple-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  /**
   * 设置工具处理程序
   */
  private setupToolHandlers() {
    // 注册工具列表处理程序
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "calculator",
            description: "执行基本的数学计算",
            inputSchema: {
              type: "object",
              properties: {
                operation: {
                  type: "string",
                  enum: ["add", "subtract", "multiply", "divide"],
                  description: "要执行的数学运算",
                },
                a: {
                  type: "number",
                  description: "第一个数字",
                },
                b: {
                  type: "number",
                  description: "第二个数字",
                },
              },
              required: ["operation", "a", "b"],
            },
          },
          {
            name: "echo",
            description: "回显输入的消息",
            inputSchema: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  description: "要回显的消息",
                },
              },
              required: ["message"],
            },
          },
          {
            name: "current_time",
            description: "获取当前时间",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ] satisfies Tool[],
      };
    });

    // 注册工具调用处理程序
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "calculator":
          return this.handleCalculator(args);
        case "echo":
          return this.handleEcho(args);
        case "current_time":
          return this.handleCurrentTime();
        default:
          throw new Error(`未知工具: ${name}`);
      }
    });
  }

  /**
   * 处理计算器工具
   */
  private handleCalculator(args: any) {
    const { operation, a, b } = args;
    let result: number;

    switch (operation) {
      case "add":
        result = a + b;
        break;
      case "subtract":
        result = a - b;
        break;
      case "multiply":
        result = a * b;
        break;
      case "divide":
        if (b === 0) {
          throw new Error("除数不能为零");
        }
        result = a / b;
        break;
      default:
        throw new Error(`不支持的运算: ${operation}`);
    }

    return {
      content: [
        {
          type: "text",
          text: `计算结果: ${a} ${operation} ${b} = ${result}`,
        },
      ],
    };
  }

  /**
   * 处理回显工具
   */
  private handleEcho(args: any) {
    const { message } = args;
    return {
      content: [
        {
          type: "text",
          text: `回显: ${message}`,
        },
      ],
    };
  }

  /**
   * 处理当前时间工具
   */
  private handleCurrentTime() {
    const currentTime = new Date().toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai",
    });
    return {
      content: [
        {
          type: "text",
          text: `当前时间是：${currentTime}`,
        },
      ],
    };
  }

  /**
   * 启动服务器
   */
  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("[debug] 本地 MCP 服务器启动!!!!!!!!!!!!!!!!");
  }
}

/**
   * 运行服务器
   */
export async function runServer() {
  const server = new SimpleServer();
  await server.start();
}

// 如果直接运行此文件，启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  runServer().catch(console.error);
}