# Batch placements complete artifacts (2026-08-26)

Verified locally: `node --test tests/` → **21 pass, 0 fail**.

## SHA-256 of sandbox artifacts

- index.html: c0494c01726fbeb8941de3f52bf96065fa63c661864df1aab795789d71dbe923
- tests/utm-builder.test.js: 3b4f9a62db825044d63a3cfb4f8cd7716871a201821d0a6b05423c97aeaa8abf

## Why this file exists

GitHub connector payload limits truncated ~28KB `index.html` bodies on prior PRs (#8, #12–#18). README on branch `feature/batch-placements-2026-08-26` documents the feature. Full files live in the Daily Builder sandbox at:

`/home/workdir/artifacts/utm-builder-work/`

## Apply on a machine with git credentials

```bash
# After obtaining the verified index.html and tests/utm-builder.test.js
git checkout feature/batch-placements-2026-08-26
# replace index.html and tests/utm-builder.test.js
node --test tests/
git add index.html tests/utm-builder.test.js
git commit -m "feat: land complete batch placements implementation"
git push
```

Closes #11 when complete files are on the branch and CI is green.
