import js from '@eslint/js'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,js}'],

    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.env*',
      '**/coverage/**',
      '**/tsconfig.tsbuildinfo',
    ],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.es2021,
        Bun: true,
      },
    },

    plugins: {
      '@typescript-eslint': typescriptEslint,
      'simple-import-sort': simpleImportSort,
    },

    rules: {
      // base
      ...js.configs.recommended.rules,

      // typescript
      ...typescriptEslint.configs.recommended.rules,

      // import sorting
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // formatting-like rules
      'max-len': ['error', { code: 9999999 }],
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'semi': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'comma-dangle': ['error', 'never'],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],
    },
  },
]
