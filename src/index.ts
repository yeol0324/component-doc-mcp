import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { listComponents } from './tools/list_components.js';
import { loadConfig } from './config.js';
import { analyzeComponent } from './tools/analyze_component.js';
import { toolHandlers } from './tools/index.js';

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
      description: 'get all components in project',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'analyze_component',
      description: 'analyzed component and create props, explain, example',
      inputSchema: {
        type: 'object',
        properties: {
          componentName: {
            type: 'string',
            description: 'component name for analyze',
          },
        },
        required: ['componentName'],
      },
    },
  ],
}));

// logic for tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const handler = toolHandlers[name];

  if (!handler) {
    return {
      content: [{ type: 'text', text: `unknown tool: ${name}` }],
      isError: true,
    };
  }

  try {
    const result = await handler(args || {}, PROJECT_ROOT, config);
    return {
      content: [{ type: 'text', text: result }],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Server running!');
}

main();
