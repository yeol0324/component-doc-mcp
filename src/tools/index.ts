import { listComponents } from './list_components.js';
import { analyzeComponent } from './analyze_component.js';
import type { Config } from '../types.js';

export type ToolHandler = {
  (args: any, projectRoot: string, config: Config): Promise<string>;
};

export const toolHandlers: Record<string, ToolHandler> = {
  list_components: async (args, projectRoot, config) => {
    return await listComponents(projectRoot, config);
  },

  analyze_component: async (args, projectRoot, config) => {
    return await analyzeComponent(args.componentName, projectRoot, config);
  },
};
