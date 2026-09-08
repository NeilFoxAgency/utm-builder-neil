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
- **Inspect existing URLs** — paste a shipped creator, bio, or ad link to refill the form and surface common shipping defects
- Quick presets aligned with creator campaigns
- Accessibility: skip link, focus-visible outlines, live status region, reduced-motion, dark mode
- Works offline after the page loads

## Why `utm_id` and placement IDs

GA4 and similar tools fragment or merge campaigns when the same human-readable `utm_campaign` name is used inconsistently. A single immutable **`utm_id`** keeps campaign-level reporting stable across every creator and placement.

A creator can publish more than one sponsored video. Put a unique **placement ID** in `utm_content` (for example `plc-greta-video-01`) so each asset is distinguishable. This matches the conventions in [creator-link-kit](https://github.com/NeilFoxAgency/creator-link-kit) (`campaign_id` → `utm_id`, `placement_id` → `utm_content`).

## Usage

1. Open the live site or clone and open `index.html` in a browser
2. Enter a base URL (http/https only)
3. Fill fields, apply a preset, or paste an existing URL into **Inspect an existing campaign URL**
4. Generate, copy, and (optionally) export history as CSV

Sanitization:

- Classic UTM fields: lowercase, underscores for spaces, restricted character set
- `utm_id`: alphanumerics plus `.` `_` `:` `-`, **case preserved**

## Privacy and security

- No network requests from the page (aside from loading the static assets themselves)
- History is stored only under the key `nfa_utm_history_v1` in the user’s browser
- CSV cells that look like spreadsheet formulas are neutralized with a leading apostrophe
- Generated and history links are built with DOM APIs (`textContent` + `href`), not HTML string injection
- History entries are re-validated on load, and only `http(s)` links are ever rendered
- Inspected URLs are parsed only in the browser; javascript/data/file schemes are rejected
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

## Governed agency batches

Open [batch.html](batch.html) locally or on the deployed Pages site. It prepares one draft connector request per placement, including multiple placements by the same creator. It preserves stable IDs, enforces exact approved hosts and HTTPS, rejects UTM collisions and duplicate placements, and never invents discount codes.

Download the intake for `python -m creator_link_kit.agency intake.json --output plan.json` to obtain audited, fingerprinted specifications. Downloaded browser requests are drafts, not provisioned links. Refresh Supabase records and approvals before executing them through the private attribution connector. There are no network calls or browser-history writes in this batch page. Editing or invalidating input clears prior output and disables export.

Run `npm test` (Node 22+) for both the original single-link tests and batch regressions. Pages deployment now waits for tests and uploads only site assets, not the entire repository.
