import nextConfig from 'eslint-config-next';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  ...nextConfig,
  {
    files: ['src/lib/**/*.ts', 'src/lib/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react/*', 'react-dom', 'react-dom/*'],
              message: 'src/lib/ must have zero UI dependencies. See CLAUDE.md hard rules.',
            },
            {
              group: ['next', 'next/*'],
              message: 'src/lib/ must have zero UI dependencies. See CLAUDE.md hard rules.',
            },
            {
              group: ['@carbon/*'],
              message: 'src/lib/ must have zero UI dependencies. See CLAUDE.md hard rules.',
            },
          ],
        },
      ],
    },
  },
];

export default config;
