import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import github from 'eslint-plugin-github'
import jest from 'eslint-plugin-jest'
import globals from 'globals'

export default [
  // Ignore patterns
  {
    ignores: ['dist/**', 'lib/**', 'node_modules/**', '__tests__/fixtures/**', 'eslint.config.mjs'],
  },

  // Base ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript ESLint recommended rules
  ...tseslint.configs.recommended,

  // GitHub plugin recommended rules
  github.getFlatConfigs().recommended,

  // Configuration for CommonJS JavaScript files
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2019,
      sourceType: 'script',
      globals: {
        ...globals.node,
        ...globals.es6,
      },
    },
    rules: {
      // Disable specific rules for CommonJS files
      'github/filenames-match-regex': 'off',
      'import/no-commonjs': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'i18n-text/no-en': 'off',
      'import/no-namespace': 'off',
      'no-implicit-globals': 'off',
      'github/no-implicit-buggy-globals': 'off',
    },
  },

  // Configuration for TypeScript files
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2019,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.es6,
      },
    },
    rules: {
      // Disable specific rules as in the original config
      'github/filenames-match-regex': 'off',
      'github/no-then': 'off',
      'i18n-text/no-en': 'off',
      'import/no-namespace': 'off',
    },
  },

  // Jest-specific configuration
  {
    files: ['**/*.test.ts', '**/*.test.js', '__tests__/**/*.ts'],
    ...jest.configs['flat/recommended'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
]
