import { readFile } from 'fs/promises';
import type { Config } from '../types.js';
import { extractProps, findComponentFile } from '../utils/componentUtils.js';

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

  const usageExample = generateUsageExample(
    componentName,
    componentPath,
    props,
  );

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

  if (usageExample) {
    result += `\nUsage Example:\n`;
    result += usageExample;
  }
  return result;
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

function generateUsageExample(
  componentName: string,
  componentPath: string,
  props: PropInfo[],
): string {
  const importValue = `import { ${componentName} } from './${componentName}';`;
  const componentStartTag = `<${componentName}`;
  let propsValue = '';
  for (const prop of props) {
    if (prop.required) {
      propsValue += `\n  ${getSamplePropsValue(prop)}`;
    }
  }
  const componentEndTag = `></${componentName}>`;

  return `\`\`\`tsx\n${importValue}\n\n${componentStartTag}${propsValue}\n${componentEndTag}\n\`\`\``;
}
function getSamplePropsValue(prop: PropInfo): string {
  const type = prop.type.toLowerCase();

  if (type.includes('string') || type.includes('"')) {
    return `${prop.name}="sample"`;
  }
  if (type.includes('number')) {
    return `${prop.name}={42}`;
  }
  if (type.includes('boolean')) {
    return `${prop.name}={true}`;
  }
  if (type.includes('=>') || type.includes('function')) {
    return `${prop.name}={() => {}}`;
  }
  return `${prop.name}={/* TODO */}`;
}
