import rwEslintConfig from '@raywhite/eslint-config'
import tseslint from 'typescript-eslint'

export default [
  {
    ignores: ['lib'],
  },
  ...rwEslintConfig,
  {
    languageOptions: {
      parserOptions: {
        warnOnUnsupportedTypeScriptVersion: false,
        // The shared config enables `projectService`, but it uses the nearest
        // tsconfig, which excludes test files. Pin classic `project` mode to
        // tsconfig-test.json so test/config files are typed for linting.
        projectService: false,
        project: './tsconfig-test.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'dot-notation': 'off',
      '@typescript-eslint/dot-notation': 'error',
      // We run sources directly under Node's type-strip; that requires
      // explicit .ts extensions on relative imports.
      'import/extensions': [
        'error',
        'ignorePackages',
        { ts: 'always', tsx: 'always', js: 'never', jsx: 'never' },
      ],
    },
  },
  {
    // Tooling/config files live outside the TS project; disable type-aware
    // linting (the files keep their own inline disables for the rest).
    files: ['eslint.config.js', '*.config.{ts,mts}'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    // Config files import their tooling from devDependencies.
    files: ['*.config.{ts,mts}'],
    rules: {
      'import/no-extraneous-dependencies': 'off',
    },
  },
]
