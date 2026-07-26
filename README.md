# UTM Builder by Neil Fox Agency

**Simple, privacy-first UTM link builder** for YouTube creator partnerships, outreach, discount codes, campaign tracking, and small business marketing.

**Live Demo:** [utm-builder-neil.neilfoxagency.com](https://utm-builder-neil.neilfoxagency.com)

## Features

- 100% client-side: zero tracking, no servers involved
- Tailored for creator campaigns and attribution reporting
- Full UTM parameter support with smart defaults and validation
- Automatic enforcement of UTM naming conventions (lowercase, underscores)
- Quick presets (YouTube, Instagram, discount, partnership, general influencer)
- Persistent link history in the browser (localStorage, last 10 links)
- Formula-safe CSV export for campaign reporting
- Keyboard and screen-reader oriented layout (skip link, focus styles, live status)
- Works offline after loading

## Recent improvements

- History survives page refresh via localStorage
- CSV cells that start with `=`, `+`, `-`, `@`, tab, or newline are neutralized for spreadsheet safety
- Generated URLs are rendered with safe DOM APIs instead of `innerHTML`
- Accessibility: skip link, named landmarks, `:focus-visible`, reduced-motion support, status region
- Clear-history control and non-blocking status feedback (no alert spam for happy paths)

## Usage

1. Visit the live site or clone and open `index.html`
2. Enter base URL
3. Apply presets or customize fields (auto-sanitized on blur)
4. Generate, copy, and track in your analytics dashboard
5. Export history to CSV for reporting, or clear history when a campaign ends

Perfect for Neil Fox Agency creator matching, outreach, deliverable tracking, UTM consistency, and reporting.

## Privacy

All processing happens in your browser. History is stored only in localStorage on your device. No analytics, telemetry, or third-party scripts are included. See [SECURITY.md](SECURITY.md).

## Why useful

Eliminates inconsistent UTM tracking in creator partnerships. Provides clean, comparable attribution data without complex tools or data collection. CSV export aids data hygiene and performance analysis.

## License

MIT

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Ideas welcome: additional presets, batch generation, more export formats, or other campaign helpers.

Made with care for small business, the creator economy, and agency workflows.
