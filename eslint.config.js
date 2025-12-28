import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';

export default tseslint.config(
  { ignores: ['dist', 'eslint.config.js'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      react,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,

      // JSX Runtime
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',

      // Custom overrides
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error', 'debug'] }],
      'prefer-const': 'warn',
      'no-unused-expressions': 'warn',
      eqeqeq: ['warn', 'always'],

      // Allow inline styles for dynamic/runtime-calculated animation properties
      'react/forbid-dom-props': ['warn', { forbid: ['style'] }],
    },
  }
);
