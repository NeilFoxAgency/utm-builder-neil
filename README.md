# UTM Builder by Neil Fox Agency

**Simple, privacy-first UTM link builder** for YouTube creator partnerships, outreach, discount codes, campaign tracking, and small business marketing.

**Live Demo:** [utm-builder-neil.neilfoxagency.com](https://utm-builder-neil.neilfoxagency.com)

## Features

- 100% client-side: no tracking, servers, cookies, or telemetry
- Optional **utm_id** for stable GA4 campaign identifiers
- Placement-oriented **utm_content** guidance (one ID per sponsored asset)
- Naming sanitization for consistent reporting
- Quick presets for common creator workflows
- History persisted in `localStorage` on this device only (max 25)
- Formula-safe CSV export for campaign reporting
- Safe URL rendering (no HTML injection of generated links)
- Works offline after the page loads
- Responsive layout with focus-visible styles and a live status region

## Privacy

All generation and history stay in the browser. History never leaves the device. Clear it anytime with **Clear History**.

## Usage

1. Open the live site or clone and open `index.html`
2. Enter an http(s) base URL
3. Apply a preset or fill fields (labels are sanitized on blur)
4. Set a stable `utm_id` for the campaign and a unique placement in `utm_content`
5. Generate, copy, and export history CSV when needed

For governed roster batch generation, production domain policy, and CI audits, use the offline CLI in [creator-link-kit](https://github.com/NeilFoxAgency/creator-link-kit).

## Why this helps

Inconsistent UTMs split GA4 dimensions and make creator ROAS hard to compare. A single stable campaign ID plus placement-level content IDs keeps reporting aligned with Neil Fox Agency creator-link conventions without collecting private campaign data.

## License

MIT

## Contributing

Open issues or PRs for additional presets, batch paste helpers, or other campaign utilities that remain fully client-side.

Made for small business, creator economy, and agency workflows.
