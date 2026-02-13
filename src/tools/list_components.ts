import { glob } from 'glob';
import * as path from 'path';
import type { Config } from '../types.js';

export async function listComponents(projectRoot: string, config: Config) {
  const files = await glob('**/*.{tsx,jsx}', {
    cwd: projectRoot,
    // TODO: add config ignore
    ignore: ['**/node_modules/**', '**/dist/**'],
  });

  const components = files
    .map((file) => {
      const name = path.basename(file, path.extname(file));
      if (name === 'index') return path.basename(path.dirname(file));
      return name;
    })
    .filter((name) => {
      return config.namingConvention.some((convention) => {
        if (convention === 'pascal') return /^[A-Z]/.test(name);
        if (convention === 'kebab') return /^[a-z]+(-[a-z]+)+$/.test(name);
        return false;
      });
    })
    .filter((name, i, arr) => arr.indexOf(name) === i)
    .sort();

  return `Components (${components.length}):\n\n${components.map((c) => `- ${c}`).join('\n')}`;
}
