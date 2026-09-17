import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ViewfinderMark, Wordmark } from "@/components/logo.tsx";
import { SearchForm } from "@/components/search-form.tsx";
import { rememberSearch, readRecentSearches, type RecentSearch } from "@/lib/history.ts";
import { compactSearch } from "@/lib/filters.ts";
import { APP_ONE_LINE, APP_TAGLINE } from "@/lib/legal.ts";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [recent, setRecent] = useState<RecentSearch[]>([]);

  useEffect(() => {
    setRecent(readRecentSearches());
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-12 sm:py-20">
      <div className="flex flex-col items-center text-center">
        <ViewfinderMark className="size-16 text-ink sm:size-20" />
        <h1 className="mt-5">
          <Wordmark className="text-4xl sm:text-5xl" />
        </h1>
        <p className="mt-3 font-serif text-lg text-ink-muted sm:text-xl">{APP_TAGLINE}</p>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-muted sm:text-base">{APP_ONE_LINE}</p>
      </div>
      <div className="mt-10">
        <SearchForm />
      </div>
      {recent.length > 0 ? (
        <section className="mt-8" aria-label="Recent searches on this browser">
          <h2 className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Recent on this browser</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {recent.map((item) => (
              <li key={item.at + item.q}>
                <Link
                  to="/search"
                  search={compactSearch(item)}
                  className="inline-flex h-9 items-center rounded-full border border-line px-3 text-sm text-ink hover:bg-canvas-elevated"
                  onClick={() => rememberSearch(item)}
                >
                  {item.q}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <p className="mt-10 text-center text-xs text-ink-subtle">
        Personal research and journalism only. Not for hiring, tenant screening, credit, or insurance.
      </p>
    </main>
  );
}
