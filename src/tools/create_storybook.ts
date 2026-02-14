import type { Config, PropInfo } from '../types.js';
import { findComponentFile, extractProps } from '../utils/componentUtils.js';
import { readFile, writeFile } from 'fs/promises';
import * as path from 'path';

export async function createStorybook(
  componentName: string,
  projectRoot: string,
  config: Config,
): Promise<string> {
  const componentPath = await findComponentFile(componentName, projectRoot);

  if (!componentPath) {
    throw new Error(`Component "${componentName}" not found.`);
  }

  const fileContent = await readFile(componentPath, 'utf-8');
  const props = extractProps(fileContent);

  const storybookContent = generateStorybookContent(
    componentName,
    componentPath,
    props,
  );

  const storybookPath = getStorybookPath(componentPath, componentName);

  await writeFile(storybookPath, storybookContent, 'utf-8');

  return `Storybook file created: ${storybookPath}`;
}

function getStorybookPath(
  componentPath: string,
  componentName: string,
): string {
  const dir = path.dirname(componentPath);
  return path.join(dir, `${componentName}.stories.tsx`);
}

function generateStorybookContent(
  componentName: string,
  componentPath: string,
  props: PropInfo[],
): string {
  const importPath = `./${path.basename(componentPath, path.extname(componentPath))}`;

  const defaultArgs = generateDefaultArgs(props);

  return `import type { Meta, StoryObj } from '@storybook/react';
import { ${componentName} } from '${importPath}';

const meta: Meta<typeof ${componentName}> = {
  title: 'Components/${componentName}',
  component: ${componentName},
};

export default meta;
type Story = StoryObj<typeof ${componentName}>;

export const Default: Story = {
  args: ${defaultArgs},
};
`;
}

function generateDefaultArgs(props: PropInfo[]): string {
  const hasChildren = props.some((p) => p.name === 'children');

  const args: string[] = [];

  if (hasChildren) {
    args.push(`children: 'Example content'`);
  }

  for (const prop of props) {
    if (prop.required && prop.name !== 'children') {
      const sampleValue = getSampleValue(prop.type);
      args.push(`${prop.name}: ${sampleValue}`);
    }
  }

  if (args.length === 0) {
    return '{}';
  }

  return `{\n    ${args.join(',\n    ')},\n  }`;
}

function getSampleValue(type: string): string {
  const typeLower = type.toLowerCase();

  if (typeLower.includes('string') || typeLower.includes('"')) {
    return `'sample'`;
  }
  if (typeLower.includes('number')) {
    return '42';
  }
  if (typeLower.includes('boolean')) {
    return 'true';
  }
  if (typeLower.includes('=>') || typeLower.includes('function')) {
    return '() => {}';
  }
  return '{}';
}
