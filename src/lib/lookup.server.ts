import { classifyQuery, type ClassifiedQuery } from "./classify.ts";
import type { SearchFilters } from "./filters.ts";
import type { LiveSourceCard, LookupResponse } from "./lookup-types.ts";

const BUDGET_MS = 12_000;
const SOURCE_MS = 8_000;
const CACHE_MS = 5 * 60 * 1000;
const UA =
  "Plainview/1.0 (public-records launcher; +https://github.com/captnwalker/plainview)";

type CacheEntry = { expires: number; value: LookupResponse };

const cache = new Map<string, CacheEntry>();

function pruneCache(now = Date.now()) {
  for (const [key, entry] of cache) {
    if (entry.expires <= now) cache.delete(key);
  }
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<{ ok: true; status: number; data: T } | { ok: false; status: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SOURCE_MS);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        accept: "application/json",
        "user-agent": UA,
        ...(init?.headers ?? {}),
      },
      redirect: "follow",
    });
    if (!response.ok) return { ok: false, status: response.status };
    const data = (await response.json()) as T;
    return { ok: true, status: response.status, data };
  } catch {
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchBuffer(url: string): Promise<{ ok: true; status: number; bytes: ArrayBuffer } | { ok: false; status: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SOURCE_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": UA },
      redirect: "follow",
    });
    if (!response.ok) return { ok: false, status: response.status };
    return { ok: true, status: response.status, bytes: await response.arrayBuffer() };
  } catch {
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

function validationCard(classified: ClassifiedQuery, filters?: SearchFilters): LiveSourceCard {
  const fields: { label: string; value: string }[] = [
    { label: "Type", value: classified.type },
    { label: "Normalized", value: classified.normalized || "—" },
    { label: "Confidence", value: classified.confidence },
  ];
  if (classified.honorific) fields.push({ label: "Honorific (stripped)", value: classified.honorific });
  if (classified.phoneE164) {
    fields.push({ label: "E.164", value: classified.phoneE164 });
    fields.push({ label: "National", value: classified.phoneNational ?? "—" });
  }
  if (classified.email) fields.push({ label: "Email", value: classified.email });
  if (classified.username) fields.push({ label: "Username", value: classified.username });
  if (classified.domain) fields.push({ label: "Domain", value: classified.domain });
  if (classified.city || classified.state || classified.zip) {
    fields.push({
      label: "Place",
      value: [classified.city, classified.state, classified.zip].filter(Boolean).join(", "),
    });
  }
  if (filters?.city || filters?.state || filters?.country) {
    fields.push({
      label: "Filters",
      value: [filters.city, filters.state, filters.country, filters.username && `@${filters.username.replace(/^@/, "")}`]
        .filter(Boolean)
        .join(" · "),
    });
  }
  if (filters?.ageMin || filters?.ageMax) {
    fields.push({
      label: "Age",
      value: `${filters.ageMin || "…"}–${filters.ageMax || "…"} (narrow on the destination)`,
    });
  }
  if (classified.secondaryTypes.length) {
    fields.push({ label: "Also treated as", value: classified.secondaryTypes.join(", ") });
  }
  return {
    id: "validation",
    title: "Validation",
    status: "ok",
    summary: classified.label,
    fields,
  };
}

async function gravatarCard(classified: ClassifiedQuery): Promise<LiveSourceCard> {
  const title = "Gravatar";
  const outboundUrl = classified.email ? `https://gravatar.com/${classified.email}` : "https://gravatar.com/";
  if (!classified.email) {
    return { id: "gravatar", title, status: "skipped", summary: "Shown for email queries.", outboundUrl };
  }
  const hash = await sha256Hex(classified.email.trim().toLowerCase());
  const avatar = `https://www.gravatar.com/avatar/${hash}?d=404&s=128`;
  const result = await fetchBuffer(avatar);
  if (!result.ok) {
    if (result.status === 404) {
      return {
        id: "gravatar",
        title,
        status: "empty",
        summary: "No public Gravatar for this email hash. That is not evidence the address is unused.",
        outboundUrl,
      };
    }
    return { id: "gravatar", title, status: "unavailable", summary: "Gravatar was unavailable.", outboundUrl };
  }
  return {
    id: "gravatar",
    title,
    status: "ok",
    summary: "A public Gravatar exists for this email hash. Not a confirmed identity.",
    outboundUrl,
    imageUrl: avatar,
    fields: [{ label: "Hash", value: "SHA-256 of the lowercased email" }],
  };
}

async function githubCard(classified: ClassifiedQuery): Promise<LiveSourceCard> {
  const title = "GitHub";
  const username = classified.username;
  const outboundUrl = username ? `https://github.com/${username}` : "https://github.com/";
  if (!username || classified.type !== "username") {
    return { id: "github", title, status: "skipped", summary: "Shown for username queries.", outboundUrl };
  }
  const result = await fetchJson<{
    login: string;
    html_url: string;
    name?: string | null;
    bio?: string | null;
    company?: string | null;
    blog?: string | null;
    location?: string | null;
    public_repos?: number;
    followers?: number;
    created_at?: string;
    avatar_url?: string;
  }>(`https://api.github.com/users/${encodeURIComponent(username)}`);
  if (!result.ok) {
    if (result.status === 404) {
      return { id: "github", title, status: "empty", summary: "No public GitHub user with this handle.", outboundUrl };
    }
    if (result.status === 403) {
      return {
        id: "github",
        title,
        status: "rate_limited",
        summary: "GitHub rate-limited this server. The profile link still works.",
        outboundUrl,
      };
    }
    return { id: "github", title, status: "unavailable", summary: "GitHub was unavailable.", outboundUrl };
  }
  const user = result.data;
  const fields = [
    { label: "Login", value: user.login },
    user.name ? { label: "Name", value: user.name } : null,
    user.company ? { label: "Company", value: user.company } : null,
    user.location ? { label: "Location", value: user.location } : null,
    user.blog ? { label: "Blog", value: user.blog } : null,
    typeof user.public_repos === "number" ? { label: "Public repos", value: String(user.public_repos) } : null,
    typeof user.followers === "number" ? { label: "Followers", value: String(user.followers) } : null,
    user.created_at ? { label: "Created", value: user.created_at.slice(0, 10) } : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row));
  return {
    id: "github",
    title,
    status: "ok",
    summary: user.bio?.trim() || "Public GitHub profile fields only. Not a confirmed identity.",
    outboundUrl: user.html_url || outboundUrl,
    imageUrl: user.avatar_url,
    fields,
  };
}

async function wikidataCard(classified: ClassifiedQuery): Promise<LiveSourceCard> {
  const title = "Wikidata / Wikipedia";
  const outboundUrl = "https://www.wikidata.org/";
  if (classified.type !== "person_name" || !classified.displayName) {
    return { id: "wikidata", title, status: "skipped", summary: "Shown for person-name queries.", outboundUrl };
  }
  const search = new URL("https://www.wikidata.org/w/api.php");
  search.searchParams.set("action", "wbsearchentities");
  search.searchParams.set("search", classified.displayName);
  search.searchParams.set("language", "en");
  search.searchParams.set("format", "json");
  search.searchParams.set("limit", "3");
  search.searchParams.set("type", "item");
  search.searchParams.set("origin", "*");
  const result = await fetchJson<{
    search?: { id: string; label: string; description?: string; concepturi?: string; url?: string }[];
  }>(search.toString());
  if (!result.ok) {
    return { id: "wikidata", title, status: "unavailable", summary: "Wikidata was unavailable.", outboundUrl };
  }
  const hits = result.data.search ?? [];
  if (!hits.length) {
    return {
      id: "wikidata",
      title,
      status: "empty",
      summary: "No public Wikidata entities for this name. Most private individuals will miss, and that is expected.",
      outboundUrl: `https://www.wikidata.org/w/index.php?search=${encodeURIComponent(classified.displayName)}`,
    };
  }
  return {
    id: "wikidata",
    title,
    status: "ok",
    summary: "Top public entities. A match is not proof this is the person you meant.",
    outboundUrl: `https://www.wikidata.org/w/index.php?search=${encodeURIComponent(classified.displayName)}`,
    items: hits.slice(0, 3).map((hit) => ({
      title: hit.label,
      detail: hit.description,
      url: hit.concepturi || `https://www.wikidata.org/wiki/${hit.id}`,
    })),
  };
}

async function ipApiCard(classified: ClassifiedQuery): Promise<LiveSourceCard> {
  const title = "IP geolocation";
  const ip = classified.ipv4 || classified.ipv6;
  const outboundUrl = ip ? `https://ip-api.com/#${ip}` : "https://ip-api.com/";
  if ((classified.type !== "ipv4" && classified.type !== "ipv6") || !ip) {
    return { id: "ip-api", title, status: "skipped", summary: "Shown for IP queries.", outboundUrl };
  }
  const fields = "status,message,country,regionName,city,isp,org,as,query";
  const https = await fetchJson<{
    status: string;
    message?: string;
    country?: string;
    regionName?: string;
    city?: string;
    isp?: string;
    org?: string;
    as?: string;
    query?: string;
  }>(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=${fields}`);
  if (!https.ok || https.data.status !== "success") {
    return {
      id: "ip-api",
      title,
      status: "unavailable",
      summary: "ip-api.com was unavailable. Infrastructure lookup only — not a person.",
      outboundUrl,
    };
  }
  const data = https.data;
  return {
    id: "ip-api",
    title,
    status: "ok",
    summary: "Infrastructure geolocation from ip-api.com. This is not a person, and city-level data is often wrong.",
    outboundUrl,
    fields: [
      data.country ? { label: "Country", value: data.country } : null,
      data.regionName ? { label: "Region", value: data.regionName } : null,
      data.city ? { label: "City", value: data.city } : null,
      data.isp ? { label: "ISP", value: data.isp } : null,
      data.org ? { label: "Org", value: data.org } : null,
      data.as ? { label: "ASN", value: data.as } : null,
    ].filter((row): row is { label: string; value: string } => Boolean(row)),
  };
}

async function zippopotamCard(classified: ClassifiedQuery): Promise<LiveSourceCard> {
  const title = "ZIP confirmation";
  const zip = classified.zip;
  const outboundUrl = zip ? `https://api.zippopotam.us/us/${zip}` : "https://www.zippopotam.us/";
  if (classified.type !== "us_address" || !zip) {
    return { id: "zippopotam", title, status: "skipped", summary: "Shown when a US ZIP is present.", outboundUrl };
  }
  const result = await fetchJson<{
    "post code"?: string;
    country?: string;
    places?: { "place name"?: string; state?: string; "state abbreviation"?: string }[];
  }>(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`);
  if (!result.ok) {
    if (result.status === 404) {
      return { id: "zippopotam", title, status: "empty", summary: "ZIP not found in Zippopotam.us.", outboundUrl };
    }
    return { id: "zippopotam", title, status: "unavailable", summary: "Zippopotam.us was unavailable.", outboundUrl };
  }
  const place = result.data.places?.[0];
  return {
    id: "zippopotam",
    title,
    status: "ok",
    summary: "Postal directory confirmation of city and state for this ZIP. Not a resident lookup.",
    outboundUrl: `https://www.zippopotam.us/`,
    fields: [
      { label: "ZIP", value: result.data["post code"] || zip },
      place?.["place name"] ? { label: "City", value: place["place name"] } : null,
      place?.state ? { label: "State", value: `${place.state} (${place["state abbreviation"] ?? ""})` } : null,
    ].filter((row): row is { label: string; value: string } => Boolean(row)),
  };
}

async function crtShCard(classified: ClassifiedQuery): Promise<LiveSourceCard> {
  const title = "Certificate transparency";
  const domain = classified.domain;
  const outboundUrl = domain ? `https://crt.sh/?q=${encodeURIComponent(domain)}` : "https://crt.sh/";
  if (classified.type !== "domain" || !domain) {
    return { id: "crtsh", title, status: "skipped", summary: "Shown for domain queries.", outboundUrl };
  }
  const result = await fetchJson<{ name_value?: string; not_before?: string }[]>(
    `https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`,
  );
  if (!result.ok || !Array.isArray(result.data)) {
    return { id: "crtsh", title, status: "unavailable", summary: "crt.sh was unavailable.", outboundUrl };
  }
  const names = [
    ...new Set(
      result.data
        .flatMap((row) => (row.name_value ?? "").split("\n"))
        .map((n) => n.trim().toLowerCase())
        .filter(Boolean),
    ),
  ].slice(0, 8);
  if (!names.length) {
    return { id: "crtsh", title, status: "empty", summary: "No recent certificate names returned.", outboundUrl };
  }
  return {
    id: "crtsh",
    title,
    status: "ok",
    summary: "Recent names from certificate transparency. Infrastructure, not a person.",
    outboundUrl,
    items: names.map((name) => ({ title: name })),
  };
}

async function rdapCard(classified: ClassifiedQuery): Promise<LiveSourceCard> {
  const title = "RDAP";
  const domain = classified.domain;
  const outboundUrl = domain
    ? `https://lookup.icann.org/en/lookup?q=${encodeURIComponent(domain)}`
    : "https://lookup.icann.org/";
  if (classified.type !== "domain" || !domain) {
    return { id: "rdap", title, status: "skipped", summary: "Shown for domain queries.", outboundUrl };
  }
  const result = await fetchJson<{
    ldhName?: string;
    status?: string[];
    events?: { eventAction?: string; eventDate?: string }[];
    entities?: { roles?: string[]; vcardArray?: unknown[] }[];
    nameservers?: { ldhName?: string }[];
  }>(`https://rdap.org/domain/${encodeURIComponent(domain)}`);
  if (!result.ok) {
    return { id: "rdap", title, status: "unavailable", summary: "RDAP endpoint did not answer.", outboundUrl };
  }
  const events = result.data.events ?? [];
  const registrarEntity = result.data.entities?.find((e) => e.roles?.includes("registrar"));
  let registrar = "";
  const vcard = registrarEntity?.vcardArray;
  if (Array.isArray(vcard) && Array.isArray(vcard[1])) {
    for (const item of vcard[1]) {
      if (Array.isArray(item) && item[0] === "fn" && typeof item[3] === "string") registrar = item[3];
    }
  }
  const fields = [
    result.data.ldhName ? { label: "Domain", value: result.data.ldhName } : null,
    registrar ? { label: "Registrar", value: registrar } : null,
    ...events
      .filter((e) => e.eventAction && e.eventDate)
      .slice(0, 4)
      .map((e) => ({ label: e.eventAction as string, value: (e.eventDate as string).slice(0, 10) })),
  ].filter((row): row is { label: string; value: string } => Boolean(row));
  return {
    id: "rdap",
    title,
    status: "ok",
    summary: "Registration data if the RDAP endpoint answered. Infrastructure, not a person.",
    outboundUrl,
    fields,
  };
}

async function withBudget<T>(work: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), BUDGET_MS);
    }),
  ]);
}

export async function runLookup(q: string, filters?: SearchFilters): Promise<LookupResponse> {
  const classified = classifyQuery(q, filters);
  if (classified.rejected === "ssn") {
    return { classified, cards: [validationCard(classified, filters)] };
  }

  const cacheKey = await sha256Hex(JSON.stringify({ n: classified.normalized, t: classified.type, f: filters ?? null }));
  pruneCache();
  const hit = cache.get(cacheKey);
  if (hit && hit.expires > Date.now()) {
    return { ...hit.value, cached: true };
  }

  const tasks: Promise<LiveSourceCard>[] = [Promise.resolve(validationCard(classified, filters))];
  if (classified.type === "email") tasks.push(gravatarCard(classified));
  if (classified.type === "username") tasks.push(githubCard(classified));
  if (classified.type === "person_name") tasks.push(wikidataCard(classified));
  if (classified.type === "ipv4" || classified.type === "ipv6") tasks.push(ipApiCard(classified));
  if (classified.type === "us_address" && classified.zip) tasks.push(zippopotamCard(classified));
  if (classified.type === "domain") {
    tasks.push(crtShCard(classified));
    tasks.push(rdapCard(classified));
  }

  const settled = await withBudget(
    Promise.allSettled(tasks),
    tasks.map(
      () =>
        ({
          status: "rejected",
          reason: new Error("budget"),
        }) as PromiseRejectedResult,
    ),
  );

  const cards: LiveSourceCard[] = settled.map((row, index) => {
    if (row.status === "fulfilled") return row.value;
    const titles = ["Validation", "Live source"];
    return {
      id: `failed-${index}`,
      title: titles[index] ?? "Live source",
      status: "unavailable" as const,
      summary: "unavailable",
    };
  });

  const value: LookupResponse = { classified, cards };
  cache.set(cacheKey, { expires: Date.now() + CACHE_MS, value });
  return value;
}
