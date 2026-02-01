import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// 서버 생성
const server = new Server({
  name: 'component-doc-mcp',
  version: '1.0.0',
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
