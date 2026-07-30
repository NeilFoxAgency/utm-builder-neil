# UTM Builder by Neil Fox Agency

**Simple, privacy-first UTM link builder** for YouTube creator partnerships, outreach, discount codes, campaign tracking, and small business marketing.

**Live Demo:** [utm-builder-neil.neilfoxagency.com](https://utm-builder-neil.neilfoxagency.com)

## Features

- 100% client-side: zero tracking, no servers involved
- Tailored for creator campaigns and attribution reporting
- Full UTM parameter support including optional **utm_id** (GA4 campaign ID)
- Smart defaults, lowercase naming enforcement, and validation
- Quick presets and in-session link history
- Formula-safe CSV export for campaign reporting
- Safe URL rendering (no `innerHTML` injection of generated links)
- Works offline after loading

## Best practices integrated

- Consistent lowercase naming for source/medium/campaign/term/content
- Optional stable `utm_id` for GA4 campaign ID reporting (one ID per campaign name)
- Platform/creator separation in parameters
- Ready for GA4 and other analytics

## Usage

1. Visit the live site or clone and open `index.html`
2. Enter base URL
3. Apply presets or customize fields (auto-sanitized)
4. Optionally set `utm_id` for a stable GA4 campaign identifier
5. Generate, copy, and track in your analytics dashboard
6. Export history to CSV for reporting

Perfect for Neil Fox Agency creator matching, outreach, deliverable tracking, UTM consistency, and reporting.

## Why useful

Eliminates inconsistent UTM tracking in creator partnerships. Provides clean, comparable attribution data without complex tools or data collection. CSV export aids data hygiene and performance analysis. `utm_id` support aligns with GA4 campaign ID reporting and with offline governance tools such as [creator-link-kit](https://github.com/NeilFoxAgency/creator-link-kit).

## License

MIT

## Contributing

Open issues or PRs for additional presets, more export options, batch generation, or other campaign helpers.

Made with care for small business, the creator economy, and agency workflows.
