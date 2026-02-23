import { parse } from '@typescript-eslint/typescript-estree';
import type { PropInfo } from '../types.js';

export function extractProps(fileContent: string): PropInfo[] {
  const ast = parse(fileContent, {
    jsx: true,
  });

  const props: PropInfo[] = [];
  const typeAliasMap = new Map<string, any>();

  for (const node of ast.body) {
    if (node.type === 'TSTypeAliasDeclaration') {
      const typeName = node.id.name;
      typeAliasMap.set(typeName, node.typeAnnotation);
    } else if (node.type === 'ExportNamedDeclaration') {
      // export로 내보낸 타입
      const declaration = node.declaration;
      if (declaration && declaration.type === 'TSTypeAliasDeclaration') {
        const typeName = declaration.id.name;
        typeAliasMap.set(typeName, declaration.typeAnnotation);
      }
    }
  }

  for (const node of ast.body) {
    let typeAliasNode = null;

    if (node.type === 'TSTypeAliasDeclaration') {
      typeAliasNode = node;
    } else if (node.type === 'ExportNamedDeclaration') {
      const declaration = node.declaration;
      if (declaration && declaration.type === 'TSTypeAliasDeclaration') {
        typeAliasNode = declaration;
      }
    }

    if (typeAliasNode) {
      const typeAnnotation = typeAliasNode.typeAnnotation;

      if (typeAnnotation.type === 'TSTypeLiteral') {
        const members = typeAnnotation.members;
        extractPropsFromMembers(members, props, typeAliasMap);
        break;
      } else if (typeAnnotation.type === 'TSIntersectionType') {
        const types = typeAnnotation.types;

        for (const type of types) {
          if (type.type === 'TSTypeLiteral') {
            const members = type.members;
            extractPropsFromMembers(members, props, typeAliasMap);
          } else if (type.type === 'TSTypeReference') {
            // @ts-ignore
            const externalTypeName = type.typeName.name;
            props.push({
              name: '...',
              type: externalTypeName,
              required: false,
              description: 'Extends all properties from this type',
            });
          }
        }
        break;
      }
    }
  }

  return props;
}

function extractPropsFromMembers(
  members: any[],
  props: PropInfo[],
  typeAliasMap: Map<string, any>,
) {
  for (const member of members) {
    if (member.type === 'TSPropertySignature') {
      const propName = member.key.name;
      const isOptional = member.optional;
      const typeNode = member.typeAnnotation?.typeAnnotation;

      if (typeNode) {
        const propType = getTypeString(typeNode, typeAliasMap);

        props.push({
          name: propName,
          type: propType,
          required: !isOptional,
        });
      }
    }
  }
}

function getTypeString(typeNode: any, typeAliasMap: Map<string, any>): string {
  switch (typeNode.type) {
    case 'TSStringKeyword':
      return 'string';

    case 'TSNumberKeyword':
      return 'number';

    case 'TSBooleanKeyword':
      return 'boolean';

    case 'TSFunctionType':
      const params = typeNode.params || [];
      const paramStr = params.length > 0 ? '...' : '';
      return `(${paramStr}) => void`;

    case 'TSTypeReference':
      const typeName = typeNode.typeName.name;

      if (typeAliasMap.has(typeName)) {
        const resolvedType = typeAliasMap.get(typeName);
        return getTypeString(resolvedType, typeAliasMap);
      }

      return typeName;

    case 'TSUnionType':
      // @ts-ignore
      const types = typeNode.types.map((t) => getTypeString(t, typeAliasMap));
      return types.join(' | ');

    case 'TSLiteralType':
      const literal = typeNode.literal;
      if (literal.type === 'Literal') {
        return JSON.stringify(literal.value);
      }
      return 'unknown';

    default:
      return 'unknown';
  }
}
