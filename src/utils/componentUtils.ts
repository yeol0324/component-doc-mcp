import { glob } from 'glob';
import * as path from 'path';
import type { Config, PropInfo } from '../types.js';

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

export function extractProps(componentContent: string): PropInfo[] {
  // TODO: TypeScript Compiler API를 사용
  // 1. 외부 타입(React.ButtonHTMLAttributes 등)을 완전히 해석하여 모든 props 추출
  // 2. 커스텀 타입 별칭(type CardMode = ...)을 해석하여 실제 값으로 치환
  //    예: mode?: CardMode → mode?: "default" | "scroll" | "expand"
  // 3. 복잡한 제네릭 타입, 유니온 타입, 인터섹션 타입 등 파싱
  // @typescript-eslint/parser 또는 typescript의 createProgram API 활용

  const props: PropInfo[] = [];

  // type Props = External type (only extension info)
  const extendsMatch = componentContent.match(
    /type\s+\w*Props\s*=\s*([^;{]+);/,
  );
  if (extendsMatch?.[1]) {
    const extendsType = extendsMatch[1].trim();
    props.push({
      name: '...',
      type: extendsType,
      required: false,
      description: 'Extends all properties from this type',
    });
    // only external type extension
    return props;
  }

  // find interface Props or type Props pattern
  const interfaceMatch = componentContent.match(
    /interface\s+\w*Props\s*{([^}]+)}/s,
  );
  const typeMatch = componentContent.match(/type\s+\w*Props\s*=\s*{([^}]+)}/s);

  const propsContent = interfaceMatch?.[1] || typeMatch?.[1];
  if (!propsContent) return props;

  let currentDescription = '';
  const lines = propsContent.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    // extract JSDoc
    const descriptionMatch = trimmedLine.match(/\/\*\*\s*(.+?)\s*\*\//);
    if (descriptionMatch?.[1]) {
      currentDescription = descriptionMatch[1];
      continue;
    }

    // extract props
    const propMatch = trimmedLine.match(/^(\w+)(\?)?:\s*([^;]+);?/);
    if (propMatch) {
      const name = propMatch[1];
      const optional = propMatch[2];
      const type = propMatch[3];

      if (name && type) {
        props.push({
          name,
          type: type.trim(),
          required: !optional,
          ...(currentDescription && { description: currentDescription }),
        });
        currentDescription = '';
      }
    }
  }

  return props;
}

export function extractCodeSnippet(fileContent: string): string {
  const returnMatches = [...fileContent.matchAll(/return\s*[\(\s]/g)];

  if (returnMatches.length === 0) {
    return 'No return statement found';
  }

  const lastReturn = returnMatches[returnMatches.length - 1];
  const returnIndex = lastReturn?.index!;

  const afterReturn = fileContent.substring(returnIndex);

  const lines = afterReturn.split('\n').slice(0, 10);

  return lines.join('\n').trim();
}

export async function findRelatedComponents(
  componentPath: string,
  currentComponentName: string,
  config: Config,
): Promise<string[]> {
  const dir = path.dirname(componentPath);

  const files = await glob('*.{tsx,jsx}', {
    cwd: dir,
  });

  const components = files
    .map((file) => path.basename(file, path.extname(file)))
    .filter((name) => name !== currentComponentName)
    .filter((name) => {
      return config.namingConvention.some((convention) => {
        if (convention === 'pascal') return /^[A-Z]/.test(name);
        if (convention === 'kebab') return /^[a-z]+(-[a-z]+)+$/.test(name);
        return false;
      });
    });

  return components;
}
