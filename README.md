# UTM Builder by Neil Fox Agency

**Simple, privacy-first UTM link builder** for YouTube creator partnerships, outreach, discount codes, campaign tracking, and small business marketing.

**Live Demo:** [utm-builder-neil.neilfoxagency.com](https://utm-builder-neil.neilfoxagency.com)

## Recent Improvements

- Automatic enforcement of UTM naming conventions (lowercase, underscores)
- Dedicated `utm_id` field for stable campaign identifiers (GA4-friendly)
- Placement-oriented `utm_content` guidance aligned with creator campaign hygiene
- Batch generation for multiple creator placements from a simple paste list
- Persistent link history in browser localStorage (stays on-device only)
- CSV export of history and batch results for campaign reporting
- Dark-mode friendly styles, focus-visible outlines, and status announcements
- Naming tips panel with best practices for creator campaigns

## Features

- 100% client-side: zero tracking, no servers involved
- Tailored for creator campaigns and attribution reporting
- Full UTM parameter support including `utm_id`
- Quick presets and persistent link history
- CSV export for batch analysis and reporting
- Works offline after loading
- Responsive and accessible

## Best Practices Integrated

- Consistent lowercase naming to prevent reporting issues
- Stable `utm_id` for campaign identity across tools
- Placement-level `utm_content` so multi-video creators stay distinct
- Platform / campaign separation in parameters
- Ready for GA4 and other analytics

## Usage

1. Visit the live site or clone and open `index.html`
2. Enter base URL
3. Apply presets or customize fields (auto-sanitized)
4. Optionally set `utm_id` and a placement-style `utm_content`
5. Generate, copy, and track in your analytics dashboard
6. Use **Batch generate** with one `source,content` line per placement
7. Export history or batch results to CSV for reporting

Perfect for Neil Fox Agency creator matching, outreach, deliverable tracking, UTM consistency, and reporting.

## Privacy

All processing happens in the browser. Link history is stored only in this browser’s `localStorage` under a non-secret key and is never transmitted. Clear site data to remove history.

## Why Useful

Eliminates inconsistent UTM tracking in creator partnerships. Provides clean, comparable attribution data without complex tools or data collection. Batch generation and CSV export aid data hygiene and performance analysis for multi-creator campaigns.

## Related

For offline convention-as-code generation, audits, and CI checks, see [creator-link-kit](https://github.com/NeilFoxAgency/creator-link-kit).

## License

MIT

## Contributing

Open issues or PRs for additional presets, more export options, or other campaign helpers.

Made with care for small business, creator economy, and agency workflows.
