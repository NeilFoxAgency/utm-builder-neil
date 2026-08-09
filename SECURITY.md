# Security

## Scope

This repository is a static, client-side UTM builder. It does not run a server, collect analytics, or store campaign data outside the visitor's browser.

## Guarantees and limits

- No third-party scripts, trackers, or network APIs are loaded by the page for link generation.
- History is stored only in `localStorage` under `nfa_utm_history_v1` and can be cleared from the UI.
- Generated and history URLs are rendered with DOM `textContent` and explicit `href` values, not HTML string injection.
- CSV exports neutralize cells that begin with spreadsheet formula trigger characters (`=`, `+`, `-`, `@`, tab, CR, LF).
- Base URLs must use the `http` or `https` scheme.

## Reporting

Report security concerns via the repository owner on GitHub. Do not include live campaign credentials, customer PII, or private merchant data in public issues.

## Related tooling

Governed offline generation and CI audits live in [creator-link-kit](https://github.com/NeilFoxAgency/creator-link-kit), which has its own security policy for the public package boundary.
