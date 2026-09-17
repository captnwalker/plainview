export type SearchFilters = {
  ageMin: string;
  ageMax: string;
  city: string;
  state: string;
  country: string;
  username: string;
};

export const EMPTY_FILTERS: SearchFilters = {
  ageMin: "",
  ageMax: "",
  city: "",
  state: "",
  country: "United States",
  username: "",
};

export type SearchQuery = SearchFilters & { q: string };

export function parseFilters(input: Partial<Record<string, unknown>>): SearchFilters {
  const str = (key: keyof SearchFilters, fallback = "") => {
    const value = input[key];
    return typeof value === "string" ? value.trim() : fallback;
  };
  return {
    ageMin: str("ageMin"),
    ageMax: str("ageMax"),
    city: str("city"),
    state: str("state"),
    country: str("country", "United States") || "United States",
    username: str("username"),
  };
}

export function compactSearch(query: SearchQuery): SearchQuery {
  const next: SearchQuery = { ...EMPTY_FILTERS, q: query.q };
  if (query.ageMin) next.ageMin = query.ageMin;
  if (query.ageMax) next.ageMax = query.ageMax;
  if (query.city) next.city = query.city;
  if (query.state) next.state = query.state;
  if (query.country && query.country !== "United States") next.country = query.country;
  else next.country = "";
  if (query.username) next.username = query.username;
  return next;
}

export function hasLocationFilters(filters: SearchFilters): boolean {
  return Boolean(filters.city || filters.state);
}

export function ageRangeLabel(filters: SearchFilters): string | null {
  if (!filters.ageMin && !filters.ageMax) return null;
  if (filters.ageMin && filters.ageMax) return `${filters.ageMin}–${filters.ageMax}`;
  if (filters.ageMin) return `${filters.ageMin}+`;
  return `up to ${filters.ageMax}`;
}
