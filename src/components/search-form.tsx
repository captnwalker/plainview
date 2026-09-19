import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, Search } from "lucide-react";
import { classifyQuery } from "@/lib/classify.ts";
import { compactSearch, EMPTY_FILTERS, hasActiveFilters, type SearchFilters } from "@/lib/filters.ts";
import { US_STATES } from "@/lib/us-states.ts";
import { cn } from "@/lib/cn.ts";

const PLACEHOLDERS = [
  "Jane Q. Public",
  "941-555-0142",
  "name@example.com",
  "@handle",
  "512 Maple Ave, Atlanta, GA",
];

type SearchFormProps = {
  initialQuery?: string;
  initialFilters?: SearchFilters;
  variant?: "hero" | "inline";
};

export function SearchForm({
  initialQuery = "",
  initialFilters = EMPTY_FILTERS,
  variant = "hero",
}: SearchFormProps) {
  const navigate = useNavigate();
  const [q, setQ] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(() => hasActiveFilters(initialFilters));

  useEffect(() => {
    setQ(initialQuery);
    setFilters(initialFilters);
    if (hasActiveFilters(initialFilters)) setFiltersOpen(true);
  }, [initialQuery, initialFilters]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, []);

  const classified = useMemo(() => classifyQuery(q, filters), [q, filters]);
  const filterPanelId = `${variant === "hero" ? "plainview-q" : "plainview-q-inline"}-filters`;

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = q.trim();
    if (!value) {
      setError("Enter a name, email, phone, username, address, domain, or IP.");
      return;
    }
    const result = classifyQuery(value, filters);
    if (result.rejected === "ssn") {
      setError("Social Security number search is not offered.");
      return;
    }
    setError(null);
    void navigate({
      to: "/search",
      search: compactSearch({ q: value, ...filters }),
    });
  }

  const inputId = variant === "hero" ? "plainview-q" : "plainview-q-inline";

  return (
    <form onSubmit={onSubmit} className="w-full" role="search">
      <label htmlFor={inputId} className="sr-only">
        Search query
      </label>
      <div
        className={cn(
          "flex items-stretch overflow-hidden rounded-xl border border-line-strong bg-canvas-elevated shadow-[var(--shadow-soft)]",
          variant === "hero" ? "h-14 sm:h-16" : "h-12",
        )}
      >
        <input
          id={inputId}
          name="q"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setError(null);
          }}
          placeholder={PLACEHOLDERS[placeholderIndex]}
          autoComplete="off"
          spellCheck={false}
          className={cn(
            "min-w-0 flex-1 bg-transparent px-4 text-ink outline-none placeholder:text-ink-subtle",
            variant === "hero" ? "text-base sm:px-5 sm:text-lg" : "px-3 text-sm",
          )}
        />
        <button
          type="submit"
          className="inline-flex h-full items-center gap-2 bg-accent px-4 text-sm font-medium text-accent-fg transition-opacity duration-150 hover:opacity-90 sm:px-5"
        >
          <Search className="size-4" strokeWidth={1.75} />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>
      <p className="mt-2 min-h-5 text-sm text-ink-muted" aria-live="polite">
        {error ? <span className="text-danger">{error}</span> : q.trim() ? classified.label : "\u00a0"}
      </p>

      <button
        type="button"
        className="mt-1 inline-flex h-11 items-center gap-1.5 text-sm text-ink-muted transition-colors duration-150 hover:text-ink"
        aria-expanded={filtersOpen}
        aria-controls={filterPanelId}
        onClick={() => setFiltersOpen((open) => !open)}
      >
        <ChevronDown
          className={cn("size-4 transition-transform duration-150", filtersOpen && "rotate-180")}
          strokeWidth={1.75}
        />
        Additional filters
        {hasActiveFilters(filters) && !filtersOpen ? (
          <span className="text-ink-subtle">· in use</span>
        ) : null}
      </button>

      {filtersOpen ? (
        <fieldset id={filterPanelId} className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <legend className="sr-only">Additional filters</legend>
          <FilterField label="City" htmlFor={`${inputId}-city`}>
            <input
              id={`${inputId}-city`}
              value={filters.city}
              onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
              className="filter-input"
              placeholder="Miami"
              autoComplete="address-level2"
            />
          </FilterField>
          <FilterField label="State" htmlFor={`${inputId}-state`}>
            <select
              id={`${inputId}-state`}
              value={filters.state}
              onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))}
              className="filter-input"
            >
              <option value="">—</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Username hint" htmlFor={`${inputId}-username`}>
            <input
              id={`${inputId}-username`}
              value={filters.username}
              onChange={(e) => setFilters((f) => ({ ...f, username: e.target.value }))}
              className="filter-input"
              placeholder="@handle"
              autoComplete="off"
            />
          </FilterField>
        </fieldset>
      ) : null}
    </form>
  );
}

function FilterField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={htmlFor} className="text-xs font-medium text-ink-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
