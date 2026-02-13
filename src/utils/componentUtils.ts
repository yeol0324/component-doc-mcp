import { glob } from 'glob';
import * as path from 'path';

export async function findComponentFile(
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
