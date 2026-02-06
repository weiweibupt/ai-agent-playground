#!/bin/bash

# Cursor MCP 配置脚本
# 自动配置本项目的 MCP Server 到 Cursor

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Cursor MCP 配置脚本${NC}"
echo ""

# 获取当前项目路径
PROJECT_PATH="$(cd "$(dirname "$0")" && pwd)"
CONFIG_FILE="$HOME/.cursor/mcp.json"

echo -e "${BLUE}📁 项目路径: ${NC}$PROJECT_PATH"
echo -e "${BLUE}📝 配置文件: ${NC}$CONFIG_FILE"
echo ""

# 检查 tsx 是否安装
if ! command -v tsx &> /dev/null; then
    echo -e "${YELLOW}⚠️  警告: tsx 未安装${NC}"
    echo -e "${YELLOW}   建议运行: npm install -g tsx${NC}"
    echo -e "${YELLOW}   或者编译项目后使用 node 命令${NC}"
    echo ""
    
    read -p "是否继续配置? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 创建配置目录
mkdir -p "$HOME/.cursor"

# 备份现有配置
if [ -f "$CONFIG_FILE" ]; then
    BACKUP_FILE="$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${YELLOW}📦 备份现有配置到: $BACKUP_FILE${NC}"
    cp "$CONFIG_FILE" "$BACKUP_FILE"
fi

# 检查是否已有配置
if [ -f "$CONFIG_FILE" ]; then
    echo -e "${BLUE}📋 检测到现有配置文件${NC}"
    echo ""
    echo "选择操作:"
    echo "  1) 添加到现有配置（推荐）"
    echo "  2) 覆盖现有配置"
    echo "  3) 取消"
    echo ""
    read -p "请选择 (1/2/3): " -n 1 -r
    echo
    
    case $REPLY in
        1)
            # 添加到现有配置
            echo -e "${BLUE}📝 添加配置到现有文件...${NC}"
            
            # 使用 jq 合并配置（如果安装了 jq）
            if command -v jq &> /dev/null; then
                TMP_FILE=$(mktemp)
                jq --arg path "$PROJECT_PATH/src/stdio_mcp/McpServer.ts" \
                   '.mcpServers["my-calculator"] = {command: "tsx", args: [$path]}' \
                   "$CONFIG_FILE" > "$TMP_FILE"
                mv "$TMP_FILE" "$CONFIG_FILE"
            else
                echo -e "${YELLOW}⚠️  未安装 jq，请手动添加以下配置到 $CONFIG_FILE:${NC}"
                echo ""
                echo '    "my-calculator": {'
                echo '      "command": "tsx",'
                echo "      \"args\": [\"$PROJECT_PATH/src/stdio_mcp/McpServer.ts\"]"
                echo '    }'
                echo ""
                exit 0
            fi
            ;;
        2)
            # 覆盖配置
            echo -e "${BLUE}📝 写入新配置...${NC}"
            cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "my-calculator": {
      "command": "tsx",
      "args": ["$PROJECT_PATH/src/stdio_mcp/McpServer.ts"]
    }
  }
}
EOF
            ;;
        *)
            echo -e "${YELLOW}❌ 已取消${NC}"
            exit 0
            ;;
    esac
else
    # 创建新配置
    echo -e "${BLUE}📝 创建新配置文件...${NC}"
    cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "my-calculator": {
      "command": "tsx",
      "args": ["$PROJECT_PATH/src/stdio_mcp/McpServer.ts"]
    }
  }
}
EOF
fi

echo ""
echo -e "${GREEN}✅ MCP 配置已完成！${NC}"
echo ""
echo -e "${BLUE}📋 配置内容:${NC}"
cat "$CONFIG_FILE"
echo ""
echo -e "${YELLOW}⚠️  重要提示:${NC}"
echo -e "${YELLOW}   1. 请完全退出 Cursor (Cmd+Q)${NC}"
echo -e "${YELLOW}   2. 重新启动 Cursor${NC}"
echo -e "${YELLOW}   3. 在 Cursor 中测试: '帮我计算 123 + 456'${NC}"
echo ""
echo -e "${GREEN}🎉 配置完成！${NC}"
