# Apply batch placements onto main

The implementation was written and verified locally against a copy of `main`.

```sh
# from a clone of this branch
patch -p1 < patches/0001-batch-placements-index.patch
# then apply the test additions in patches/0002-batch-placements-tests.patch
node --test tests/utm-builder.test.js
```

Local verification (Node 20, 2026-09-02):

```
# 20 passed, 0 failed
```

Security preserved:

- `loadHistory()` still keeps only `http(s)` URLs
- no `innerHTML` for generated URLs
- no `window.lastBatch` (module-scoped `lastBatch`)
- no network calls
- batch CSV uses `csvSafe`
