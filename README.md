# UTM Builder by Neil Fox Agency

**Simple, privacy-first UTM link builder** for YouTube creator partnerships, outreach, discount codes, campaign tracking, and small business marketing.

**Live Demo:** [utm-builder-neil.neilfoxagency.com](https://utm-builder-neil.neilfoxagency.com)

## Recent Improvements
- **utm_id support** — optional stable campaign identifier (GA4-recommended) for cleaner multi-placement reporting
- Automatic enforcement of UTM naming conventions (lowercase, underscores/hyphens)
- New 'General Influencer' preset and enhanced others (presets now include suggested `utm_id`)
- Dedicated naming tips panel with best practices for creator campaigns and placement IDs
- Improved input sanitization, focus styles, and accessibility (labels, live regions, keyboard focus)
- Better copy button experience and CSV export of link history (includes `utm_id`)

## Features
- 100% client-side: zero tracking, no servers involved
- Tailored for creator campaigns and attribution reporting
- Full UTM parameter support including `utm_id` with smart defaults and validation
- Quick presets and persistent link history (session)
- CSV export for batch analysis and reporting
- Works offline after loading
- Responsive and accessible

## Best Practices Integrated
- Consistent lowercase naming to prevent reporting issues
- Prefer one immutable `utm_id` (campaign ID) across all placements in a campaign
- Prefer unique `utm_content` / placement IDs when a creator has multiple assets
- Platform/creator separation in parameters
- Ready for GA4 and other analytics
- Aligns with [creator-link-kit](https://github.com/NeilFoxAgency/creator-link-kit) conventions (`campaign_id` → `utm_id`, `placement_id` → `utm_content`)

## Usage
1. Visit the live site or clone and open `index.html`
2. Enter base URL
3. Apply presets or customize fields (auto-sanitized)
4. Optionally set `utm_id` for stable campaign-level reporting
5. Generate, copy, and track in your analytics dashboard
6. Export history to CSV for reporting

Perfect for Neil Fox Agency creator matching, outreach, deliverable tracking, UTM consistency, and reporting.

## Why Useful
Eliminates inconsistent UTM tracking in creator partnerships. Provides clean, comparable attribution data without complex tools or data collection. CSV export aids in data hygiene and performance analysis. `utm_id` reduces silent merge issues in GA4 when the same campaign runs across many creators and placements.

## License
MIT

## Contributing
Open issues or PRs for additional presets, more export options, batch generation, or other campaign helpers.

Made with ❤️ for small business, creator economy, and agency workflows.
