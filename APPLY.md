# Apply complete batch artifacts

This branch already contains README updates.

Verified locally (Node 20):

```
node --test tests/utm-builder.test.js
# 20 passed
```

The complete `index.html` and `tests/utm-builder.test.js` live in the Daily Builder workspace as:

- `/home/workdir/artifacts/utm-index.html` (25,210 bytes)
- `/home/workdir/artifacts/utm-builder.test.js` (20,129 bytes)

If connector payload limits block those two files, copy them onto this branch from a machine with git credentials.

Do not merge until both files are present and CI is green.
