import { readFile } from 'fs/promises';
import type { Config, PropInfo } from '../types.js';
import { extractProps, findComponentFile } from '../utils/componentUtils.js';

type DescriptionSuggestion = {
  componentName: string;
  props: PropInfo[];
  codeSnippet: string;
  relatedComponents: string[];
  fileContext: string;
};

export async function suggestDescription(
  componentName: string,
  projectRoot: string,
  config: Config,
) {
  const componentPath = await findComponentFile(componentName, projectRoot);

  if (!componentPath) {
    throw new Error(`Component "${componentName}" not found.`);
  }
  const fileContent = await readFile(componentPath, 'utf-8');
  const props = extractProps(fileContent);

  const suggestion: DescriptionSuggestion = {
    componentName,
    props,
    codeSnippet: '', // TODO
    relatedComponents: [], // TODO
    fileContext: componentPath,
  };
  return formatSuggestion(suggestion);
}

function formatSuggestion(suggestion: DescriptionSuggestion): string {
  return `
Component: ${suggestion.componentName}
Location: ${suggestion.fileContext}

Props (${suggestion.props.length}):
${suggestion.props.map((p) => `- ${p.name}: ${p.type}`).join('\n')}

Code snippet:
${suggestion.codeSnippet}

Related components in same directory:
${suggestion.relatedComponents.join(', ')}
  `.trim();
}
