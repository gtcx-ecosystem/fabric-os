const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const eslintConfigPrettier = require('eslint-config-prettier');
const globals = require('globals');

module.exports = tseslint.config(
  // Global ignores
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      '.turbo/',
      'coverage/',
      '*.js.map',
      '*.d.ts.map',
      // Build artifacts in 03-platform/agents/ (generated from TypeScript)
      '03-platform/agents/**/*.js',
      '03-platform/agents/**/*.js.map',
      '03-platform/agents/**/*.d.ts',
      '03-platform/agents/**/*.d.ts.map',
      // MCP server build outputs
      '03-platform/mcp/dist/',
      '03-platform/mcp/lib/**/*.js',
      '03-platform/mcp/lib/**/*.js.map',
      '03-platform/mcp/lib/**/*.d.ts',
      '03-platform/mcp/lib/**/*.d.ts.map',
      '03-platform/mcp/03-platform/tools/**/*.js',
      '03-platform/mcp/03-platform/tools/**/*.js.map',
      '03-platform/mcp/03-platform/tools/**/*.d.ts',
      '03-platform/mcp/03-platform/tools/**/*.d.ts.map',
    ],
  },

  // Base JS recommended rules — scoped to JS/TS files only
  {
    files: ['**/*.{js,ts,tsx,mjs,cjs}'],
    ...js.configs.recommended,
  },

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Prettier compatibility (must be last among rule configs)
  eslintConfigPrettier,

  // JavaScript files (Node.js scripts) — allow Node.js globals across
  // both CommonJS and ESM tool packages.
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
        AbortController: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        crypto: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        structuredClone: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
  },

  // CommonJS files — allow require/module forms.
  {
    files: ['**/*.{js,cjs}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // TypeScript and general rules
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Repo tool scripts intentionally write structured CLI/test output.
  {
    files: ['platform/**/*.mjs', 'deploy/**/*.mjs'],
    rules: {
      'no-console': 'off',
    },
  }
);
