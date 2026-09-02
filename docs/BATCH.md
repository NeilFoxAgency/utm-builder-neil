# Batch placements

Use **Batch placements** when one creator ships more than one sponsored asset.

## Behavior

- Paste one placement ID per line.
- IDs are sanitized the same way as `utm_content` (lowercase, spaces to underscores).
- Duplicates are dropped case-insensitively after sanitization.
- At most 40 IDs are accepted.
- Shared campaign fields (`utm_source`, `utm_medium`, `utm_campaign`, `utm_id`, `utm_term`) stay the same.
- Each ID is written to `utm_content`.
- Only `http` and `https` base URLs are accepted.
- Batch links render with DOM nodes (`textContent` + `href`), never `innerHTML`.
- Batch CSV uses the same spreadsheet-formula neutralization as history export.
- Batch generation does **not** flood private history (max 25 single links).
- `lastBatch` is module-scoped inside the page IIFE, not attached to `window`.

## Example

Base URL: `https://shop.example.com/offer`

Placement IDs:

```
plc-greta-video-01
plc-greta-video-02
plc-priya-video-01
```

Result: three tracked URLs that differ only by `utm_content`.

## Tests

`tests/utm-builder.test.js` covers parse/dedupe/cap, distinct content, invalid base URLs, and batch CSV export.
