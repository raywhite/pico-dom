# @raywhite/pico-dom

## 1.1.0

### Minor Changes

- d65920d: Upgrade parse5 v3 → v8 via the standalone `parse5-htmlparser2-tree-adapter`.
  Drops the static `stream` edge parse5 v3 pulled into client bundles. The public
  API (`parse`, `stringify`, `map`, `reduce`, `adapter`, exported types) is
  unchanged.

## 1.0.0

### Major Changes

- 212c283: Migrate to TypeScript; ship generated types; dual CJS/ESM exports.
