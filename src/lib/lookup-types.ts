import type { ClassifiedQuery } from "./classify.ts";
import type { SearchFilters } from "./filters.ts";

export type SourceStatus = "ok" | "empty" | "unavailable" | "rate_limited" | "skipped";

export type LiveSourceCard = {
  id: string;
  title: string;
  status: SourceStatus;
  summary: string;
  outboundUrl?: string;
  fields?: { label: string; value: string }[];
  imageUrl?: string;
  items?: { title: string; url?: string; detail?: string }[];
};

export type LookupRequest = {
  q: string;
  filters?: SearchFilters;
};

export type LookupResponse = {
  classified: ClassifiedQuery;
  cards: LiveSourceCard[];
  cached?: boolean;
};
