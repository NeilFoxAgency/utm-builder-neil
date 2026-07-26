# Security Policy

## Scope

`utm-builder-neil` is a static, client-side web page. It does not run a backend, collect credentials, or send data to Neil Fox Agency servers.

## Data handling

- UTM parameters and generated links are processed only in the browser.
- Optional history is stored in `localStorage` under a versioned key on the user's device.
- Clearing history removes those entries from the local browser only.
- No cookies, analytics beacons, or third-party scripts are shipped with this tool.

## CSV export

Exported CSV cells that begin with characters commonly interpreted as spreadsheet formulas (`=`, `+`, `-`, `@`, tab, CR, LF) are prefixed with a single apostrophe so applications such as Excel, Google Sheets, and LibreOffice treat them as text. This reduces the risk of formula injection when campaign values contain untrusted text.

## URL display

Generated and history links are inserted with `textContent` and explicit `href` assignment rather than HTML string concatenation, reducing XSS risk from unusual base URLs.

## Reporting issues

If you find a security or privacy issue in this repository, open a GitHub issue with a clear description and steps to reproduce. Do not include secrets or personal data in public reports.
