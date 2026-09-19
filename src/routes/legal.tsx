import { createFileRoute } from "@tanstack/react-router";
import { LEGAL_DISCLAIMER } from "@/lib/legal.ts";

export const Route = createFileRoute("/legal")({
  component: LegalPage,
  head: () => ({ meta: [{ title: "Legal · Plainview" }] }),
});

function LegalPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
      <h1 className="font-serif text-4xl">Legal</h1>
      <p className="mt-4 text-ink-muted">{LEGAL_DISCLAIMER}</p>

      <section className="mt-10 space-y-4 text-sm leading-relaxed text-ink">
        <h2 className="font-serif text-2xl">Terms and acceptable use</h2>
        <p>
          Plainview is a launcher. It classifies what you type, fetches a short list of no-key public JSON
          APIs, and builds outbound links to websites you could visit yourself. You are responsible for how
          you use those destinations and for complying with their terms.
        </p>
        <p>You may not use this site, or the destinations it links to, to:</p>
        <ul className="list-disc space-y-1 pl-5 text-ink-muted">
          <li>Make employment, tenant, credit, insurance, or other FCRA-covered decisions</li>
          <li>Stalk, harass, threaten, dox, or impersonate anyone</li>
          <li>Commit fraud, identity theft, or other crimes</li>
          <li>Bypass access controls, scrape behind logins, or collect dumped credentials</li>
        </ul>
      </section>

      <section className="mt-10 space-y-4 text-sm leading-relaxed">
        <h2 className="font-serif text-2xl">Fair Credit Reporting Act</h2>
        <p>
          Plainview is not a consumer reporting agency and does not furnish consumer reports. It does not
          assemble, evaluate, or sell information bearing on a person’s credit worthiness, character, general
          reputation, personal characteristics, or mode of living for FCRA-covered purposes. Do not brand,
          export, or treat anything on this site as a background report, screening report, or suitability
          score. Do not use it to decide whether to hire, rent, lend, or insure.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-sm leading-relaxed">
        <h2 className="font-serif text-2xl">What we do not collect</h2>
        <ul className="list-disc space-y-1 pl-5 text-ink-muted">
          <li>No accounts, logins, or user profiles</li>
          <li>No server-side storage of queries, results, or IP-to-query logs</li>
          <li>No Social Security numbers — SSN-shaped input is rejected and is not searched</li>
          <li>No face uploads, reverse-image, or biometric search</li>
          <li>No leaked passwords, dumps, or Have I Been Pwned API results</li>
        </ul>
        <p className="text-ink-muted">
          Optional last-10 search history, theme preference, and the opt-out checklist stay in this
          browser’s localStorage only (<code className="text-ink">plainview-recent</code>,{" "}
          <code className="text-ink">plainview-theme</code>,{" "}
          <code className="text-ink">plainview-optout</code>). We do not store those on a server.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-sm leading-relaxed">
        <h2 className="font-serif text-2xl">Remove my listings</h2>
        <p>
          The /remove page is a guide to official self-service opt-out forms on certain people-search
          sites, plus Google’s own Results about you tool. It is only for requesting removal of{" "}
          <strong>your own</strong> listing or Search snippets. Plainview does not submit those forms,
          solve CAPTCHAs, read your email, act as an authorized agent, or send opt-out requests in anyone
          else’s name. Search results do not include a “remove this person” control. Hiding a result in
          Google Search does not delete the underlying page.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-sm leading-relaxed">
        <h2 className="font-serif text-2xl">What we do not offer</h2>
        <ul className="list-disc space-y-1 pl-5 text-ink-muted">
          <li>SSN or other government ID lookup</li>
          <li>Criminal-record productization</li>
          <li>PDF or dossier downloads</li>
          <li>Paywalls, “unlock full report,” or verified-identity claims</li>
          <li>SMTP or password-reset account enumeration from our servers</li>
          <li>Automated opt-out submission or removal of anyone else’s listing</li>
        </ul>
      </section>

      <section className="mt-10 space-y-4 text-sm leading-relaxed">
        <h2 className="font-serif text-2xl">Outbound sites</h2>
        <p className="text-ink-muted">
          Destinations have their own terms, privacy policies, and data quality. Their records may be wrong,
          stale, or about a different person with a similar name. We do not control them and we do not
          vouch for them.
        </p>
      </section>
    </main>
  );
}
