import vitest from '@vitest/eslint-plugin';
import importX from 'eslint-plugin-import-x';
import { jsdoc } from 'eslint-plugin-jsdoc';
import prettier from 'eslint-plugin-prettier/recommended';
import sortDestructureKeys from 'eslint-plugin-sort-destructure-keys';
import unicorn from 'eslint-plugin-unicorn';
import neostandard from 'neostandard';

/**
 * @type {Array<import('eslint').Linter.Config>}
 */
export default [
  ...neostandard({ noJsx: true, semi: true, ts: false }),
  jsdoc({ config: 'flat/recommended-typescript-flavor-error' }),
  unicorn.configs['recommended'],
  {
    files: ['*.js', '**/*.js'],
    ignores: ['**/coverage', 'eslint.config.js'],
    languageOptions: {
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
      'sort-destructure-keys': sortDestructureKeys,
      'import-x': importX,
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
