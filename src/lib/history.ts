import type { SearchQuery } from "./filters.ts";

const KEY = "plainview-recent";
const LIMIT = 10;

export type RecentSearch = SearchQuery & { at: number };

export function readRecentSearches(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is RecentSearch => {
        return Boolean(item && typeof item === "object" && typeof (item as RecentSearch).q === "string");
      })
      .slice(0, LIMIT);
  } catch {
    return [];
  }
}

export function rememberSearch(query: SearchQuery) {
  const q = query.q.trim();
  if (!q) return;
  const next: RecentSearch[] = [
    { ...query, q, at: Date.now() },
    ...readRecentSearches().filter((item) => item.q.toLowerCase() !== q.toLowerCase()),
  ].slice(0, LIMIT);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
