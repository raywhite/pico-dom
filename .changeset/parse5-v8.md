---
"@raywhite/pico-dom": minor
---

Upgrade parse5 v3 → v8 via the standalone `parse5-htmlparser2-tree-adapter`.
Drops the static `stream` edge parse5 v3 pulled into client bundles. The public
API (`parse`, `stringify`, `map`, `reduce`, `adapter`, exported types) is
unchanged.
