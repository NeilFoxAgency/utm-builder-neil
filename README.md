# UTM Builder by Neil Fox Agency

**Simple, privacy-first UTM link builder** for YouTube creator partnerships, outreach, discount codes, campaign tracking, and small business marketing.

**Live demo:** [utm-builder-neil.neilfoxagency.com](https://utm-builder-neil.neilfoxagency.com)

## Features

- **100% client-side** — no servers, analytics, cookies, or third-party scripts
- Classic UTM parameters plus optional **`utm_id`** (stable GA4 campaign identifier)
- Placement-oriented **`utm_content`** guidance (one ID per sponsored asset)
- **Persistent history** in `localStorage` (max 25 links, never leaves the device)
- **CSV export** with spreadsheet-formula neutralization
- Safe DOM rendering (no `innerHTML` for generated URLs)
- Quick presets aligned with creator campaigns
- Optional **batch placements**: paste up to 40 placement IDs and generate one unique `utm_content` link per asset
- Accessibility: skip link, focus-visible outlines, live status region, reduced-motion, dark mode
- Works offline after the page loads

## Why `utm_id` and placement IDs

GA4 and similar tools fragment or merge campaigns when the same human-readable `utm_campaign` name is used inconsistently. A single immutable **`utm_id`** keeps campaign-level reporting stable across every creator and placement.

A creator can publish more than one sponsored video. Put a unique **placement ID** in `utm_content` (for example `plc-greta-video-01`) so each asset is distinguishable. This matches the conventions in [creator-link-kit](https://github.com/NeilFoxAgency/creator-link-kit) (`campaign_id` → `utm_id`, `placement_id` → `utm_content`).

## Usage

1. Open the live site or clone and open `index.html` in a browser
2. Enter a base URL (http/https only)
3. Fill fields or apply a preset
4. Generate, copy, and (optionally) export history as CSV
5. For multi-video campaigns, open **Batch placements**, paste one placement ID per line, then generate, copy all, or export a batch CSV

Sanitization:

- Classic UTM fields: lowercase, underscores for spaces, restricted character set
- `utm_id`: alphanumerics plus `.` `_` `:` `-`, **case preserved**

## Privacy and security

- No network requests from the page (aside from loading the static assets themselves)
- History is stored only under the key `nfa_utm_history_v1` in the user’s browser
- CSV cells that look like spreadsheet formulas are neutralized with a leading apostrophe
- Generated and history links are built with DOM APIs (`textContent` + `href`), not HTML string injection
- History entries are re-validated on load, and only `http(s)` links are ever rendered
- Batch generation stays on-device and does not write every placement into history
- See [SECURITY.md](SECURITY.md)

## Development and tests

The tool ships as a single dependency-free HTML file — there is nothing to install. The regression suite in `tests/` extracts the real inline script from `index.html` and runs it under Node's built-in test runner with a minimal fake DOM, so the shipped artifact itself is verified.

Requirements: Node.js 20 or newer.

```sh
node --test tests/
# or
npm test
```

## Related tooling

For governed batch generation, audits, discount-code templates, and CI checks, use [creator-link-kit](https://github.com/NeilFoxAgency/creator-link-kit). This page is the lightweight interactive companion.

## License

MIT

## Contributing

Open issues or pull requests for additional presets, batch paste helpers, or other campaign UX improvements. Prefer one coherent change per PR.
