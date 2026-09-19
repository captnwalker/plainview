import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_ONE_LINE, APP_TAGLINE } from "@/lib/legal.ts";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({ meta: [{ title: "About · Plainview" }] }),
});

function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
      <h1 className="font-serif text-4xl">About</h1>
      <p className="mt-3 font-serif text-xl text-ink-muted">{APP_TAGLINE}</p>
      <p className="mt-4 text-ink-muted">{APP_ONE_LINE}</p>

      <section className="mt-10 space-y-3 text-sm leading-relaxed">
        <h2 className="font-serif text-2xl">What Plainview is</h2>
        <p>
          A Google-simple launcher for information that is already public. You type a name, email, phone,
          username, address, domain, or IP. We classify it, show a few keyless public-API snippets, and
          hand you curated deep links to established OSINT and public-records tools.
        </p>
        <p>
          It is built for personal research, journalism, and OSINT practice — and as a portfolio demo of
          how to do that without pretending to be a background-check company.
        </p>
      </section>

      <section className="mt-10 space-y-3 text-sm leading-relaxed">
        <h2 className="font-serif text-2xl">What Plainview is not</h2>
        <ul className="list-disc space-y-1 pl-5 text-ink-muted">
          <li>Not a consumer reporting agency</li>
          <li>Not a background check, tenant screen, or “safe to hire” product</li>
          <li>Not a verified-identity service</li>
          <li>Not a dump browser, dark-web search, or credential warehouse</li>
          <li>Not a substitute for primary-source reporting</li>
        </ul>
      </section>

      <section className="mt-10 space-y-3 text-sm leading-relaxed">
        <h2 className="font-serif text-2xl">How a search works</h2>
        <ol className="list-decimal space-y-2 pl-5 text-ink-muted">
          <li>Your query is classified in the browser (email, phone, name, username, address, domain, IP).</li>
          <li>Social Security number shapes are rejected immediately. We never search them.</li>
          <li>
            A serverless lookup asks only no-key public APIs (Gravatar, GitHub, Wikidata, ip-api, Zippopotam,
            crt.sh, RDAP), with a short in-memory cache. Queries are not written to a database.
          </li>
          <li>Outbound tool URLs are built from a curated catalog. You leave Plainview to use them.</li>
        </ol>
      </section>

      <section className="mt-10 space-y-3 text-sm leading-relaxed">
        <h2 className="font-serif text-2xl">Removing your own listings</h2>
        <p>
          If a people-search site has a public opt-out,{" "}
          <Link to="/remove" className="text-accent hover:underline">
            Remove my listings
          </Link>{" "}
          points you at that site’s official form and at Google’s Results about you tool. We do not file
          the request for you, and we do not offer removal of anyone else’s row. Hiding a snippet in Search
          does not delete the source page.
        </p>
      </section>

      <p className="mt-10 text-sm text-ink-muted">
        Read the <Link to="/legal" className="text-accent hover:underline">legal page</Link> and the{" "}
        <Link to="/tools" className="text-accent hover:underline">tools directory</Link> before you search.
      </p>
    </main>
  );
}
