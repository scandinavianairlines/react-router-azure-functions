import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import vitest from '@vitest/eslint-plugin';
import importX from 'eslint-plugin-import-x';
import { jsdoc } from 'eslint-plugin-jsdoc';
import node from 'eslint-plugin-n';
import prettier from 'eslint-plugin-prettier/recommended';
import promise from 'eslint-plugin-promise';
import sortDestructureKeys from 'eslint-plugin-sort-destructure-keys';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';

/**
 * @type {Array<import('eslint').Linter.Config>}
 */
export default [
  js.configs.recommended,
  node.configs['flat/recommended-module'],
  promise.configs['flat/recommended'],
  jsdoc({ config: 'flat/recommended-typescript-flavor-error' }),
  unicorn.configs.recommended,
  {
    files: ['*.js', '**/*.js'],
    ignores: ['**/coverage', 'eslint.config.js'],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true,
          jsx: false,
        },
        ecmaVersion: 'latest',
      },
      sourceType: 'module',
    },
    plugins: {
      '@stylistic': stylistic,
      'sort-destructure-keys': sortDestructureKeys,
      'import-x': importX,
      n: node,
    },
    settings: {
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      jsdoc: {
        mode: 'typescript',
      },
    },
    rules: {
      '@stylistic/space-before-function-paren': [
        'error',
        { anonymous: 'always', named: 'never', asyncArrow: 'always' },
      ],
      strict: 'error',
      'sort-destructure-keys/sort-destructure-keys': ['error'],
      'jsdoc/valid-types': ['warn'],
      'n/file-extension-in-import': ['error', 'always'],
      'n/no-missing-import': 'warn',
      'n/no-unsupported-features/node-builtins': 'off',
      'import-x/no-unresolved': 'error',
      'import-x/named': 'error',
      'import-x/namespace': 'error',
      'import-x/default': 'error',
      'import-x/export': 'error',
      'import-x/no-named-as-default': 'warn',
      'import-x/no-named-as-default-member': 'warn',
      'import-x/no-duplicates': 'warn',
    },
  },
  {
    files: ['**/?(*.)+(spec|test).?(m)[jt]s?(x)'],
    languageOptions: {
      globals: { ...globals.node, ...globals.vitest },
    },
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      'unicorn/error-message': 'off',
      'unicorn/no-null': 'off',
      'unicorn/no-unreadable-new-expression': 'off',
      'unicorn/prefer-https': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/consistent-function-scoping': 'off',
    },
  },
  prettier,
];
