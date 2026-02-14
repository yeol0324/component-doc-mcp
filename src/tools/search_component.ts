import type { Config } from '../types.js';
import { getAllComponents } from '../utils/componentUtils.js';

export async function searchComponent(
  query: string,
  projectRoot: string,
  config: Config,
): Promise<string> {
  const allComponents = await getAllComponents(projectRoot, config);

  const queryLower = query.toLowerCase();
  const matches = allComponents.filter((componentName) =>
    componentName.toLowerCase().includes(queryLower),
  );

  if (matches.length === 0) {
    return `No components found matching "${query}"`;
  }

  return `Found ${matches.length} component(s) matching "${query}":\n\n${matches.map((c) => `- ${c}`).join('\n')}`;
}
