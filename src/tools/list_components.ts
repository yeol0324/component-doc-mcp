import { glob } from 'glob';
import * as path from 'path';

export async function listComponents(projectRoot: string) {
  const files = await glob('**/*.{tsx,jsx}', {
    cwd: projectRoot,
    ignore: ['**/node_modules/**', '**/dist/**'],
  });

  const components = files
    .map((file) => {
      const name = path.basename(file, path.extname(file));
      if (name === 'index') return path.basename(path.dirname(file));
      return name;
    })
    .filter((name) => /^[A-Z]/.test(name))
    .filter((name, i, arr) => arr.indexOf(name) === i)
    .sort();

  return `컴포넌트 목록 (${components.length}개):\n\n${components.map((c) => `- ${c}`).join('\n')}`;
}
