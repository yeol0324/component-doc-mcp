import { glob } from 'glob';
import * as path from 'path';
import { readFile } from 'fs/promises';

import type { Config } from '../config.js';

export async function analyzeComponent(
  componentName: string,
  projectRoot: string,
  config: Config,
) {
  const componentPath = await findComponentFile(componentName, projectRoot);

  if (!componentPath) return `Component "${componentName}" not found.`;

  const componentContent = await readFile(componentPath, 'utf-8');

  return `Component "${componentName}" in "${componentPath}"\n${componentContent}`;
}

async function findComponentFile(
  componentName: string,
  projectRoot: string,
): Promise<string | null> {
  const patterns = [
    `**/${componentName}.tsx`,
    `**/${componentName}.jsx`,
    `**/${componentName}/index.tsx`,
    `**/${componentName}/index.jsx`,
  ];

  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: projectRoot,
      // TODO: add config ignore
      ignore: ['**/node_modules/**', '**/dist/**'],
    });
    if (files.length > 0) {
      const file = files[0];
      if (file) {
        return path.join(projectRoot, file);
      }
    }
  }
  return null;
}
