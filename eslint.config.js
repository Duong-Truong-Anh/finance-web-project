// @ts-check
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  // Ignore generated and dependency directories
  { ignores: ['dist/', 'node_modules/', '.astro/'] },

  // TypeScript rules for all TS/TSX files
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },

  // Load-bearing boundary: src/lib must have zero UI dependencies.
  // The lib layer is pure TypeScript — it runs in the browser, in a
  // Worker, or in a Node script without modification. Any import from
  // a UI layer breaks that guarantee.
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['**/components/**'],
            message: '[boundary] src/lib must not import from src/components. Keep lib pure — zero UI deps.',
          },
          {
            group: ['**/features/**'],
            message: '[boundary] src/lib must not import from src/features. Keep lib pure — zero UI deps.',
          },
          {
            group: ['**/layouts/**'],
            message: '[boundary] src/lib must not import from src/layouts. Keep lib pure — zero UI deps.',
          },
          {
            group: ['react', 'react-dom', 'react/*', '@astrojs/*'],
            message: '[boundary] src/lib must not import React or Astro. Keep lib pure — zero UI deps.',
          },
        ],
      }],
    },
  },
);
