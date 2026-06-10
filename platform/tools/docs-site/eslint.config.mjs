import root from '../../../config/toolchain/eslint.config.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...root,
  {
    files: ['scripts/**/*.mjs', '*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
];
