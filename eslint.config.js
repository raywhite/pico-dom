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
    // The source is a faithful TS port of the original JS wrapper. Its imperative
    // module style (IIFE namespaces, manual loop counters, `_`-prefixed handles to
    // the wrapped originals) is intentional and behaviour-preserving, so relax the
    // shared config's stylistic rules that conflict with it rather than rewriting
    // logic. The `any`-typed compose/sequence chains are documented in-source.
    files: ['src/**/*.ts', '__tests__/**/*.{ts,tsx}'],
    rules: {
      'no-plusplus': 'off',
      'no-param-reassign': 'off',
      'no-underscore-dangle': 'off',
      'func-names': 'off',
      'prefer-arrow-callback': 'off',
      '@typescript-eslint/no-shadow': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-namespace': 'off',
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
