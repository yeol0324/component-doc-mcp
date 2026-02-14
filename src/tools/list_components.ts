import type { Config } from '../types.js';
import { getAllComponents } from '../utils/componentUtils.js';

export async function listComponents(projectRoot: string, config: Config) {
  const components = await getAllComponents(projectRoot, config);
  return `Components (${components.length}):\n\n${components.map((c) => `- ${c}`).join('\n')}`;
}
