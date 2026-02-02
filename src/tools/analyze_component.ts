import { glob } from 'glob';
import * as path from 'path';
import { readFile } from 'fs/promises';

import type { Config } from '../config.js';

type PropInfo = {
  name: string;
  type: string;
  required: boolean;
  description?: string;
};

export async function analyzeComponent(
  componentName: string,
  projectRoot: string,
  config: Config,
) {
  const componentPath = await findComponentFile(componentName, projectRoot);

  if (!componentPath)
    throw new Error(`Component "${componentName}" not found.`);

  const componentContent = await readFile(componentPath, 'utf-8');

  const props = extractProps(componentContent);

  const { description, hasDescription } = extractDescription(componentContent);
  let result = `Component "${componentName}" in "${componentPath}"\n\n`;

  result += 'Description:\n';
  if (hasDescription) {
    result += `${description}\n\n`;
  } else {
    result += 'No description found. Consider adding JSDoc comments.\n\n';
  }

  if (props.length === 0) {
    result += 'Props: None defined\n';
  } else {
    result += `Props (${props.length}):\n\n`;
    for (const prop of props) {
      result += `- ${prop.name}${prop.required ? '' : '?'}: ${prop.type}\n`;
      if (prop.description) {
        result += `  ${prop.description}\n`;
      }
    }
  }

  return result;
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

function extractProps(componentContent: string): PropInfo[] {
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

function extractDescription(componentContent: string): {
  description: string;
  hasDescription: boolean;
} {
  const jsDocMatch = componentContent.match(
    /\/\*\*\s*\n([\s\S]*?)\*\/\s*(?:export\s+)?(?:const|function)/,
  );

  if (jsDocMatch?.[1]) {
    const rawComment = jsDocMatch[1];
    const cleanedComment = rawComment
      .split('\n')
      .map((line) => line.replace(/^\s*\*\s?/, '').trim())
      .filter((line) => line.trim())
      .join('\n');

    return {
      description: cleanedComment,
      hasDescription: true,
    };
  }

  return {
    description: 'Component with no description',
    hasDescription: false,
  };
}
