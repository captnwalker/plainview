import { allTypes, type ClassifiedQuery, type QueryType } from "./classify.ts";
import { ageRangeLabel, type SearchFilters } from "./filters.ts";
import { GROUP_META, TOOLS, type Tool, type ToolGroupId } from "./tools.ts";

const REQUIRED_KEYS = new Set([
  "name",
  "first",
  "last",
  "email",
  "phone",
  "phoneDigits",
  "phoneDashed",
  "phoneNational",
  "username",
  "domain",
  "ip",
  "url",
  "address",
  "addressSlug",
  "nameSlug",
  "nameHyphen",
  "quotedName",
  "quotedEmail",
]);

export type TemplateVars = Record<string, string>;

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function hyphenName(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.replace(/[^\w.-]/g, ""))
    .filter(Boolean)
    .join("-");
}

function dashedPhone(digits: string): string {
  const d = digits.replace(/\D/g, "");
  const national = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  if (national.length === 10) {
    return `${national.slice(0, 3)}-${national.slice(3, 6)}-${national.slice(6)}`;
  }
  return national;
}

export function templateVars(classified: ClassifiedQuery, filters?: SearchFilters): TemplateVars {
  const name = classified.displayName ?? classified.normalized;
  const city = classified.city || filters?.city || "";
  const state = classified.state || filters?.state || "";
  const zip = classified.zip || "";
  const citystatezip = [city, state, zip].filter(Boolean).join(", ");
  const ip = classified.ipv4 || classified.ipv6 || "";
  const address = classified.addressRaw || classified.street || "";
  const email = classified.email || "";
  const query = classified.normalized || classified.raw.trim();

  const vars: TemplateVars = {
    query,
    name,
    first: classified.givenName || "",
    last: classified.familyName || "",
    email,
    phone: classified.phoneE164 || "",
    phoneDigits: classified.phoneDigits || "",
    phoneDashed: classified.phoneDigits ? dashedPhone(classified.phoneDigits) : "",
    phoneNational: classified.phoneNational || "",
    username: classified.username || filters?.username?.replace(/^@/, "") || "",
    domain: classified.domain || "",
    ip,
    url: classified.url || "",
    address,
    addressSlug: address ? slugify(address) : "",
    nameSlug: name ? slugify(name) : "",
    nameHyphen: name ? hyphenName(name) : "",
    city,
    state,
    zip,
    citystatezip,
    quotedName: name ? `"${name}"` : "",
    quotedCity: city ? `"${city}"` : "",
    quotedEmail: email ? `"${email}"` : "",
    quotedQuery: query ? `"${query}"` : "",
  };
  return vars;
}

export type BuiltToolLink = {
  tool: Tool;
  url: string;
  prefilled: boolean;
};

export function buildToolUrl(tool: Tool, vars: TemplateVars): BuiltToolLink {
  const placeholders = [...tool.urlTemplate.matchAll(/\{([a-zA-Z]+)\}/g)].map((m) => m[1]);
  const missingRequired = placeholders.filter((key) => REQUIRED_KEYS.has(key) && !vars[key]);
  if (missingRequired.length > 0 || tool.urlTemplate === tool.homepage) {
    return {
      tool,
      url: tool.homepage,
      prefilled: false,
    };
  }

  const url = tool.urlTemplate.replace(/\{([a-zA-Z]+)\}/g, (_, key: string) => {
    const value = vars[key] ?? "";
    return encodeURIComponent(value);
  });

  const prefilled = placeholders.some((key) => Boolean(vars[key])) && url !== tool.homepage;
  return { tool, url, prefilled };
}

function matchesType(tool: Tool, types: QueryType[]): boolean {
  return tool.types.some((t) => types.includes(t));
}

export type ToolSection = {
  id: ToolGroupId;
  title: string;
  hint?: string;
  links: BuiltToolLink[];
};

export function toolsForQuery(classified: ClassifiedQuery, filters?: SearchFilters): ToolSection[] {
  const types = allTypes(classified);
  if (classified.rejected === "ssn") return [];

  const vars = templateVars(classified, filters);
  const matching = TOOLS.filter((tool) => matchesType(tool, types)).sort((a, b) => b.weight - a.weight);

  const bestCount = 6;
  const bestPool = matching.filter((t) => t.group !== "advanced");
  const bestIds = new Set(bestPool.slice(0, bestCount).map((t) => t.id));

  const byGroup = new Map<ToolGroupId, BuiltToolLink[]>();
  byGroup.set("best", []);
  for (const meta of GROUP_META) {
    if (meta.id !== "best") byGroup.set(meta.id, []);
  }

  for (const tool of matching) {
    const link = buildToolUrl(tool, vars);
    if (bestIds.has(tool.id)) {
      byGroup.get("best")?.push(link);
    }
    byGroup.get(tool.group)?.push(link);
  }

  const infraOnly = types.includes("domain") || types.includes("ipv4") || types.includes("ipv6") || types.includes("url");

  return GROUP_META.map((meta) => {
    const links = byGroup.get(meta.id) ?? [];
    if (meta.id === "infra" && !infraOnly) return { ...meta, links: [] };
    return { ...meta, links };
  }).filter((section) => section.links.length > 0);
}

export function googleNameVariantLinks(classified: ClassifiedQuery): BuiltToolLink[] {
  if (classified.type !== "person_name" || !classified.nameVariants) return [];
  const primary = classified.displayName ?? classified.normalized;
  return classified.nameVariants
    .filter((variant) => variant !== primary)
    .slice(0, 3)
    .map((variant, index) => ({
      tool: {
        id: `google-variant-${index}`,
        name: `Google (${variant})`,
        homepage: "https://www.google.com/",
        urlTemplate: "https://www.google.com/search?q={query}",
        types: ["person_name"],
        region: "global" as const,
        blurb: "Name variant. Age filters should be applied on the destination.",
        weight: 40,
        group: "web" as const,
      },
      url: `https://www.google.com/search?q=${encodeURIComponent(variant)}`,
      prefilled: true,
    }));
}

export function copyMarkdown(classified: ClassifiedQuery, sections: ToolSection[], filters?: SearchFilters): string {
  const lines: string[] = [
    `# Plainview search`,
    ``,
    `- Query: ${classified.normalized || classified.raw}`,
    `- Type: ${classified.type}`,
  ];
  if (classified.phoneE164) lines.push(`- Phone: ${classified.phoneE164} (${classified.phoneNational})`);
  if (classified.email) lines.push(`- Email: ${classified.email}`);
  if (classified.username) lines.push(`- Username: ${classified.username}`);
  if (classified.city || classified.state || filters?.city) {
    lines.push(`- Place: ${[classified.city || filters?.city, classified.state || filters?.state].filter(Boolean).join(", ")}`);
  }
  const age = filters ? ageRangeLabel(filters) : null;
  if (age) lines.push(`- Age (narrow on destination): ${age}`);
  lines.push(``, `Links are outbound. Data is unverified.`);
  for (const section of sections) {
    lines.push(``, `## ${section.title}`);
    for (const link of section.links) {
      lines.push(`- ${link.tool.name}: ${link.url}`);
    }
  }
  return lines.join("\n");
}
