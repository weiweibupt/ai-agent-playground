import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import http from "http";

/**
 * 创建 HTTP MCP 服务器
 * 提供通过 HTTP/SSE 访问的 MCP 服务
 */

// 创建 MCP Server 实例
const server = new Server(
  {
    name: "http-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

console.log("[MCPHttpServer] [初始化] (1/3) 1/6 实例化Server:::", );

console.log("[MCPHttpServer] [初始化] (2/3) 1/6 注册工具");
// 注册工具：问候工具
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "greet",
        description: "向用户问候",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "要问候的人的名字",
            },
          },
          required: ["name"],
        },
      },
      {
        name: "get_time",
        description: "获取当前时间",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ] satisfies Tool[],
  };
});

console.log("[MCPHttpServer] [初始化] (3/3) 1/6 注册工具调用处理器");
// 注册工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "greet") {
    const userName = args.name || "朋友";
    return {
      content: [
        {
          type: "text",
          text: `你好，${userName}！欢迎使用 HTTP MCP 服务器！`,
        },
      ],
    };
  }

  if (name === "get_time") {
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

  throw new Error(`未知工具: ${name}`);
});

// 创建 HTTP 服务器
const PORT = 3000;

// 存储活动的传输连接（支持多个客户端同时连接）
let currentTransport: SSEServerTransport | null = null;

const httpServer = http.createServer(async (req, res) => {
  // 处理 CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // SSE 端点 - GET 请求用于建立 SSE 连接
  if (req.url === "/sse" && req.method === "GET") {
    console.log("[MCPHttpServer] [/sse]  2/6 收到 SSE 连接请求 (GET) :::", );

    // // 设置 SSE 响应头
    // res.writeHead(200, {
    //   "Content-Type": "text/event-stream",
    //   "Cache-Control": "no-cache",
    //   "Connection": "keep-alive",
    // });

    // // 发送 endpoint 事件，告诉客户端 POST 消息的端点
    // res.write(`event: endpoint\ndata: /message\n\n`);

    // 创建新的 SSEServerTransport，第一个参数是消息端点路径
    currentTransport = new SSEServerTransport("/message", res);
    await server.connect(currentTransport);

    console.log("[MCPHttpServer] [/sse] [connect] 3/6 SSE 连接已建立，currentTransport:::", );

    // 连接关闭时清理
    res.on("close", () => {
      console.log("[MCPHttpServer] [/sse] [res.on('close')] 6/6 SSE 连接关闭,清理currentTransport");
      currentTransport = null;
    });

    return;
  }

  // 消息端点 - POST 请求用于客户端向服务器发送消息
  // 必须使用 transport.handlePostMessage() 来处理
  // 注意：req.url 可能包含查询参数，如 /message?sessionId=xxx
  if (req.url?.startsWith("/message") && req.method === "POST") {
    console.log("[MCPHttpServer] [/message]  4/6 收到 /message (POST),req:::", );

    if (!currentTransport) {
      console.error("❌ 没有活动的 SSE 连接");
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No active SSE connection" }));
      return;
    }

    // 使用 SSEServerTransport 的 handlePostMessage 方法处理消息
    await currentTransport.handlePostMessage(req, res);
    console.log("[MCPHttpServer] [/message]  5/6 消息已处理,res:::", );
    return;
  }

  // 健康检查端点
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", server: "http-mcp-server" }));
    return;
  }

  // 404
  console.log("[MCPHttpServer] [/]  ❌404 Not Found,req:::", req, "res:::", );
  res.writeHead(404);
  res.end("Not Found");
});

// 启动服务器
httpServer.listen(PORT, () => {
  console.log(`[MCPHttpServer]🚀 HTTP MCP 服务器启动成功！`);
  console.log(`📡 SSE 端点: http://localhost:${PORT}/sse`);
  console.log(`🏥 健康检查: http://localhost:${PORT}/health`);
});

// 错误处理
server.onerror = (error) => {
  console.error("❌ MCP 服务器错误:", error);
};

process.on("SIGINT", async () => {
  console.log("\n🛑 正在关闭服务器...");
  httpServer.close();
  await server.close();
  process.exit(0);
});
