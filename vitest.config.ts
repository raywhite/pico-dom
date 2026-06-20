import { defineConfig } from 'vitest/config'

export default defineConfig({
  // JSX in the test suite compiles to the pico-dom adapter factory, matching
  // how @raywhite/markup consumes it. Configure the transform accordingly.
  oxc: {
    jsx: {
      runtime: 'classic',
      pragma: 'adapter.createNode',
      // Disable the dev transform so no `__source`/`__self` props are injected,
      // keeping parsed and JSX-built trees structurally identical.
      development: false,
    },
  },
  test: {
    globals: true,
    include: ['__tests__/**/*.test.{ts,tsx}'],
    typecheck: {
      tsconfig: './tsconfig-test.json',
    },
  },
})
