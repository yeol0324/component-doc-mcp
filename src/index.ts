import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { listComponents } from './tools/list_components.js';
import { loadConfig } from './config.js';

const PROJECT_ROOT =
  process.argv[2] || process.env.PROJECT_ROOT || process.cwd();
const config = loadConfig(PROJECT_ROOT);

// create server
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

// config list tools
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

// logic for tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name } = request.params;
  if (name === 'list_components') {
    const result = await listComponents(PROJECT_ROOT, config);
    return {
      content: [
        {
          type: 'text',
          text: result,
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

// start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Server running!');
}

main();
