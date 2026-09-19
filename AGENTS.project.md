# Plainview — project rules

Stack, commands, and hard legal constraints for this app. The sandbox
platform contract lives in `AGENTS.md` and must not be replaced.

## Stack

- TanStack Start (Vite, App Router-style file routes) + React 19 + TypeScript strict + Tailwind v4
- Vercel via the existing Nitro preset (not a Next.js app — the live preview and this workspace’s deploy adapter require TanStack Start)
- No database, no auth, no API keys, no env-based third-party credentials
- Phone parsing: `libphonenumber-js`
- SHA-256 (Web Crypto) for Gravatar hashes

## Commands

- `npm run dev` — development server on `0.0.0.0:8080`
- `npm run build` — production build
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint
- `npm test` — includes classifier + URL template + opt-out catalog unit tests

## Hard legal rules

- Not a consumer reporting agency. Do not assemble, sell, or brand background reports, screening reports, or suitability scores.
- Do not market for employment, tenant screening, credit, insurance, or other FCRA-covered decisions.
- Never accept, store, validate, or search Social Security numbers. Reject `###-##-####` and nine-digit input.
- No face upload, reverse image, or biometric search. PimEyes is outbound-only.
- No server-side storage of queries, results, or IP-to-query logs.
- No accounts, paywalls, “unlock full report,” or PDF/dossier download.
- Do not display leaked passwords, dumps, or full breach records.
- Do not call the Have I Been Pwned API. Link the public page only.
- Do not scrape people-search, breach, or social HTML. No Puppeteer / stealth browsers.
- Do not use copy that says “most accurate,” “verified identity,” “official background check,” or “safe to hire / rent.”
- Footer + results banner + `/legal` must carry the required disclaimer substance.
- `/remove` may only guide the user to official opt-out forms for their own listings. No auto-submit, no CAPTCHA solving, no authorized-agent flow, no “remove this person” on search results.

## Live sources (keyless only)

Validation, Gravatar, GitHub public user, Wikidata/Wikipedia search, ip-api.com, Zippopotam.us, crt.sh, RDAP. Nothing else.

## Outbound catalog

Curated in `src/lib/tools.ts`. Never describe a destination as an FCRA background check. Instant Checkmate, TruthFinder, BeenVerified, and FastBackgroundCheck stay out.
