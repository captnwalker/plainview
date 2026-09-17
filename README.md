# Plainview

**What’s already public.**

A Google-simple public-records and OSINT launcher. Type a name, email, phone, username, address, domain, or IP. See a few keyless public-API snippets plus curated deep links to established OSINT tools.

Plainview is **not** a consumer reporting agency and does not furnish consumer reports. Do not use it for employment, tenant, credit, or insurance decisions.

## Example (fictional only)

Search: `Jane Q. Public`  
Optional filters: city `Fort Myers`, state `FL`

That query is classified as a person name, opens Wikidata search (usually empty for private individuals), and builds outbound links to public people-search and web tools. It is not a background check.

Other fictional examples:

- `name@example.com`
- `941-555-0142`
- `@handle`
- `512 Maple Ave, Fort Myers, FL`
- `example.com`

## What it does

1. Classifies the query in shared TypeScript (`src/lib/classify.ts`).
2. Rejects Social Security number shapes and stops.
3. Fetches a short list of **no-key** public APIs from `/api/lookup` (Gravatar, GitHub, Wikidata, ip-api, Zippopotam.us, crt.sh, RDAP).
4. Builds outbound URLs from `src/lib/tools.ts`. You leave Plainview to use them.

Searches are not stored on a server. Last 10 queries and theme preference stay in this browser’s `localStorage` only.

## Local development

```bash
npm install
npm run dev
```

Then open the app, type a fictional name, and press Search.

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Stack

TanStack Start + React + TypeScript + Tailwind CSS, deployed as Vercel serverless. No database and no auth.

This repo uses TanStack Start rather than Next.js App Router so the existing Vite/Vercel adapter and live preview keep working. File routes still map to `/`, `/search`, `/about`, `/tools`, `/legal`, and `/api/lookup`.

## GitHub and Vercel

Intended public repo: `captnwalker/plainview`.

```bash
gh repo create captnwalker/plainview --public --source=. --remote=origin --push
```

On Vercel: Import the GitHub repo with **Continue with GitHub**. No environment variables are required for v1.

## Legal scope

Plainview links to publicly available sources and fetches a few public APIs. It is not a consumer reporting agency and does not provide consumer reports under the Fair Credit Reporting Act. Do not use this site or its destinations to make employment, tenant, credit, or insurance decisions. We do not collect accounts, we do not store your searches on a server, and we do not sell data. Do not use this service to stalk, harass, dox, or impersonate anyone. Social Security number search is not offered. Face search is not offered. Outbound sites have their own terms. Their data is unverified and may be wrong or stale.

Full terms: `/legal`.

## License

MIT
