import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// 서버 생성
const server = new Server(
  {
    name: 'component-doc-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// 도구 목록 정의
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_components',
      description: '프로젝트 내 모든 컴포넌트 목록을 가져옵니다.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ],
}));

// 도구 실행 로직
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;

  if (name === 'list_components') {
    return {
      content: [
        {
          type: 'text',
          text: '컴포넌트 목록: 구현 중입니다.',
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: `알 수 없는 도구: ${name}`,
      },
    ],
  };
});

// 서버 시작
async function main() {
  // Claude와 서버 사이의 통신 방식, stdio(표준 입출력) 사용
  const transport = new StdioServerTransport();
  await server.connect(transport);
  //console.log는 MCP 통신용 채널이라서 서버의 디버그 메시지는 error 사용
  console.error('Server running!');
}

main();
