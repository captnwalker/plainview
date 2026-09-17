import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DisclaimerBanner } from "@/components/disclaimer-banner.tsx";
import { LiveCards } from "@/components/live-cards.tsx";
import { ResultsActions } from "@/components/results-actions.tsx";
import { SearchForm } from "@/components/search-form.tsx";
import { ToolSections } from "@/components/tool-sections.tsx";
import { googleNameVariantLinks, toolsForQuery } from "@/lib/build-url.ts";
import { classifyQuery } from "@/lib/classify.ts";
import { parseFilters, type SearchQuery } from "@/lib/filters.ts";
import { rememberSearch } from "@/lib/history.ts";
import { SSN_REJECTION } from "@/lib/legal.ts";
import type { LiveSourceCard, LookupResponse } from "@/lib/lookup-types.ts";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchQuery => ({
    q: typeof search.q === "string" ? search.q : "",
    ...parseFilters(search),
  }),
  component: SearchPage,
  head: () => ({
    meta: [{ title: "Search · Plainview" }],
  }),
});

function SearchPage() {
  const search = Route.useSearch();
  const filters = useMemo(
    () => ({
      ageMin: search.ageMin,
      ageMax: search.ageMax,
      city: search.city,
      state: search.state,
      country: search.country,
      username: search.username,
    }),
    [search.ageMin, search.ageMax, search.city, search.state, search.country, search.username],
  );
  const classified = useMemo(() => classifyQuery(search.q, filters), [search.q, filters]);
  const sections = useMemo(() => {
    const base = toolsForQuery(classified, filters);
    const variants = googleNameVariantLinks(classified);
    if (!variants.length) return base;
    return base.map((section) =>
      section.id === "web" ? { ...section, links: [...section.links, ...variants] } : section,
    );
  }, [classified, filters]);

  const [cards, setCards] = useState<LiveSourceCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    if (!search.q.trim() || classified.rejected === "ssn") return;
    rememberSearch({ q: search.q, ...filters });
  }, [search.q, filters, classified.rejected]);

  useEffect(() => {
    if (!search.q.trim() || classified.rejected === "ssn") {
      setCards([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setLookupError(null);
    void (async () => {
      try {
        const response = await fetch("/api/lookup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ q: search.q, filters }),
          signal: controller.signal,
        });
        const data = (await response.json()) as LookupResponse & { error?: string; message?: string };
        if (!response.ok) {
          setLookupError(data.message || "Lookup failed.");
          setCards([]);
          return;
        }
        setCards(data.cards ?? []);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setLookupError("Live sources could not be reached. Outbound links still work.");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [search.q, filters, classified.rejected]);

  if (!search.q.trim()) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="font-serif text-3xl">Search</h1>
        <p className="mt-2 text-ink-muted">Enter a query to continue.</p>
        <div className="mt-6">
          <SearchForm initialFilters={filters} variant="inline" />
        </div>
      </main>
    );
  }

  if (classified.rejected === "ssn") {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="font-serif text-3xl">SSN search is not offered</h1>
        <p className="mt-4 max-w-2xl text-ink-muted">{SSN_REJECTION}</p>
        <div className="mt-8">
          <SearchForm initialFilters={filters} variant="inline" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <div className="max-w-3xl">
        <SearchForm initialQuery={search.q} initialFilters={filters} variant="inline" />
      </div>
      <div className="mt-6">
        <DisclaimerBanner />
      </div>
      <header className="mt-8">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Results for</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">{classified.normalized}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {classified.label}. Public links and a few keyless APIs — unverified, incomplete, not a report.
        </p>
      </header>
      <div className="mt-6">
        <ResultsActions classified={classified} sections={sections} filters={filters} query={search.q} />
      </div>
      <section className="mt-10" aria-labelledby="live-heading">
        <h2 id="live-heading" className="font-serif text-xl text-ink">
          Live public APIs
        </h2>
        <p className="mt-1 mb-4 text-sm text-ink-muted">
          Keyless sources only. One dead source will not hide the rest. Nothing here is stored on a server.
        </p>
        {lookupError ? <p className="mb-3 text-sm text-warn">{lookupError}</p> : null}
        <LiveCards cards={cards} loading={loading} />
      </section>
      <div className="mt-12">
        <ToolSections sections={sections} />
      </div>
    </main>
  );
}
