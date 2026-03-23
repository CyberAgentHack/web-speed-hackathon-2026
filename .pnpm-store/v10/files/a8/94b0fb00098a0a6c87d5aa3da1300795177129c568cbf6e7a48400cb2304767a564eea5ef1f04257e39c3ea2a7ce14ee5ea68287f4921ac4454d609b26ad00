/**
 * @license
 * Copyright 2025 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ModuleDeclaration,
  SourceFile,
  TypeAliasDeclaration,
} from 'ts-morph';

export function getNamespaces(file: SourceFile, s: String) {
  const result: ModuleDeclaration[] = [];
  for (const n of file.getModules()) {
    if (n.getDeclarationKind() === 'namespace') {
      if (s === n.getName()) {
        result.push(n);
      }
    }
  }
  return result;
}

export interface SpecType {
  inputFile: string;
  commandType: string;
  modulePrefix: string;
}
export interface MappingInterface {
  method: string;
  params: string;
  resultType: string;
}

export function getTypeInNamespaceOrThrow(
  file: SourceFile,
  typeWithNamespace: String,
): TypeAliasDeclaration {
  const [namespaceName, typeName] = typeWithNamespace.split('.') as [
    string,
    string,
  ];

  for (const namespace of getNamespaces(file, namespaceName)) {
    const type = namespace.getTypeAlias(typeName);

    if (type) {
      return type;
    }
  }

  throw new Error('Not found');
}

export function getResultNameFromMethod(method: string) {
  const type = method
    .split('.')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('.');
  return `${type}Result`;
}
