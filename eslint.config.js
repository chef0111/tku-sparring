import { tanstackConfig } from '@tanstack/eslint-config';

export default [
  ...tanstackConfig,

  {
    ignores: [
      '.output/**',
      'node_modules/**',
      'dist/**',
      'eslint.config.js',
      '.agents/**',
      '**/server.js',
    ],
  },
  {
    rules: {
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/naming-convention': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
