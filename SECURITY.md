# Security policy

## Scope

This repository is a **static, client-side only** UTM link builder. It must not contain:

- API keys, tokens, passwords, or private keys
- Server-side code, analytics, or telemetry
- Customer, creator contact, or campaign performance data
- Merchant or order data

## Client-side boundaries

- History is stored in the browser under `localStorage` key `nfa_utm_history_v1` and never transmitted by this page.
- Base URLs are restricted to the `http:` and `https:` schemes.
- Generated and history URLs are rendered with DOM APIs (`createElement`, `textContent`, `href`), not `innerHTML`.
- CSV export neutralizes cells that begin with formula trigger characters (`=`, `+`, `-`, `@`, tab, CR, LF) so untrusted campaign values cannot become spreadsheet formulas when opened in Excel, Google Sheets, or LibreOffice.

## Reporting

If you discover a vulnerability in this static page (for example XSS or unsafe export behavior), open a private security advisory on the repository or email the maintainer through the public profile contact. Please do not open a public issue with exploit details until a fix is available.
