# Plainview v1 status

## Done

- Homepage with viewfinder mark, wordmark, rotating placeholders, live type label, always-visible filters, theme toggle (light default, honors `prefers-color-scheme`, persists `plainview-theme`)
- Query classifier shared by client and `/api/lookup` (email, phone, person name, username, US address, domain, IPv4/IPv6, URL, unknown)
- SSN-shaped input is rejected; no search runs
- Results page with legal banner, live keyless cards, outbound catalog groups, copy query / open top 5 / copy markdown
- Live sources: validation, Gravatar (email), GitHub (username), Wikidata (person name), ip-api (IP), Zippopotam.us (ZIP), crt.sh + RDAP (domain)
- Pages: `/about`, `/tools`, `/legal`
- `robots.txt` allow, MIT license, unit tests for classifier + URL builder
- No database, no auth, no API keys, no server-side query logs
- Public GitHub repo: https://github.com/captnwalker/plainview (`main`)

## Stack note

v1 uses **TanStack Start** (Vite) instead of Next.js App Router. Reason: this workspace’s live preview and Vercel adapter are TanStack Start. Product routes and `/api/lookup` match the spec.

## Catalog links dropped or downgraded

- No public no-key **carrier-lookup** page with a stable query URL was kept. SpyDialer remains as an outbound homepage (copy the number on-site).
- IntelTechniques name / phone / username pages do not take query strings; they open the tool homepage with copy-to-clipboard.
- Redfin is linked with a query path, not an undocumented internal API.
- Instant Checkmate, TruthFinder, BeenVerified, and FastBackgroundCheck were never added.
- Have I Been Pwned is outbound-page only (no API, no key, no stub).

## GitHub / Vercel

GitHub is done: [captnwalker/plainview](https://github.com/captnwalker/plainview).

On Vercel: Continue with GitHub and import `captnwalker/plainview`. No env vars.

## Left for later

- Vercel import of `captnwalker/plainview`
- Optional: richer address parser, more name-variant engine, per-county assessor deep links
