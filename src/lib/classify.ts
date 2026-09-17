import { parsePhoneNumberFromString, type PhoneNumber } from "libphonenumber-js";
import { stateCodeFromText } from "./us-states.ts";
import type { SearchFilters } from "./filters.ts";

export type QueryType =
  | "email"
  | "phone"
  | "person_name"
  | "username"
  | "us_address"
  | "domain"
  | "ipv4"
  | "ipv6"
  | "url"
  | "unknown";

export type Confidence = "high" | "medium" | "low";

export type ClassifiedQuery = {
  type: QueryType;
  secondaryTypes: QueryType[];
  raw: string;
  normalized: string;
  confidence: Confidence;
  rejected?: "ssn";
  email?: string;
  phoneE164?: string;
  phoneNational?: string;
  phoneDigits?: string;
  username?: string;
  honorific?: string;
  givenName?: string;
  familyName?: string;
  middleName?: string;
  displayName?: string;
  nameVariants?: string[];
  domain?: string;
  ipv4?: string;
  ipv6?: string;
  url?: string;
  addressRaw?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  label: string;
};

const HONORIFICS = new Set(["mr", "mrs", "ms", "miss", "dr", "prof", "sir", "rev", "esq"]);

const STREET_SUFFIX =
  "(?:ave|avenue|st|street|rd|road|dr|drive|ln|lane|blvd|boulevard|ct|court|cir|circle|way|pl|place|hwy|highway|pkwy|parkway|ter|terrace|trl|trail|loop|pass|pike|sq|square|row|run|xing|crossing|walk|path|aly|alley|ext|extension)";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,24}$/i;
const DOMAIN_RE =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/i;
const IPV4_RE =
  /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
const USERNAME_RE = /^@?[a-z0-9._-]{2,64}$/i;

const TYPE_LABELS: Record<QueryType | "ssn", string> = {
  email: "Looks like an email",
  phone: "Looks like a US phone",
  person_name: "Looks like a person name",
  username: "Looks like a username",
  us_address: "Looks like a US address",
  domain: "Looks like a domain",
  ipv4: "Looks like an IPv4 address",
  ipv6: "Looks like an IPv6 address",
  url: "Looks like a URL",
  unknown: "Not sure yet — we will still build search links",
  ssn: "Looks like a Social Security number",
};

export function looksLikeSsn(input: string): boolean {
  const trimmed = input.trim();
  if (/^\d{3}-\d{2}-\d{4}$/.test(trimmed)) return true;
  if (/^\d{3}\s\d{2}\s\d{4}$/.test(trimmed)) return true;
  if (/^\d{9}$/.test(trimmed)) return true;
  return false;
}

function isIPv6(value: string): boolean {
  if (!value.includes(":") || /[^0-9a-f:]/i.test(value)) return false;
  const halves = value.split("::");
  if (halves.length > 2) return false;
  const checkGroup = (g: string) => /^[0-9a-f]{1,4}$/i.test(g);
  if (halves.length === 1) {
    const groups = value.split(":");
    return groups.length === 8 && groups.every(checkGroup);
  }
  const left = halves[0] ? halves[0].split(":").filter(Boolean) : [];
  const right = halves[1] ? halves[1].split(":").filter(Boolean) : [];
  if (left.some((g) => !checkGroup(g)) || right.some((g) => !checkGroup(g))) return false;
  return left.length + right.length <= 7;
}

function titleCaseToken(token: string): string {
  if (/^[A-Z]\.$/.test(token)) return token.toUpperCase();
  if (token.includes("-")) return token.split("-").map(titleCaseToken).join("-");
  if (token.includes("'")) {
    return token
      .split("'")
      .map((part, i) => (i === 0 ? titleCaseToken(part) : part.toLowerCase() === "s" ? "s" : titleCaseToken(part)))
      .join("'");
  }
  if (token.length <= 2 && /^[a-z]+\.?$/i.test(token)) return token.toUpperCase();
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

function stripHonorific(tokens: string[]): { honorific?: string; rest: string[] } {
  if (!tokens.length) return { rest: tokens };
  const first = tokens[0].replace(/\.$/, "").toLowerCase();
  if (HONORIFICS.has(first)) {
    return { honorific: titleCaseToken(tokens[0].replace(/\.$/, "")) + (tokens[0].endsWith(".") || first === "mr" || first === "mrs" || first === "dr" ? "." : ""), rest: tokens.slice(1) };
  }
  return { rest: tokens };
}

function parsePersonName(raw: string): {
  honorific?: string;
  givenName?: string;
  middleName?: string;
  familyName?: string;
  displayName: string;
  variants: string[];
} | null {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;

  if (trimmed.includes(",") && !trimmed.includes("@")) {
    const [lastPart, firstPart] = trimmed.split(",").map((s) => s.trim());
    if (lastPart && firstPart && /^[a-z][a-z'. -]+$/i.test(lastPart) && /^[a-z][a-z'. -]+$/i.test(firstPart)) {
      return parsePersonName(`${firstPart} ${lastPart}`);
    }
  }

  const tokens = trimmed.split(" ").filter(Boolean);
  const { honorific, rest } = stripHonorific(tokens);
  if (rest.length < 2) return null;
  if (!rest.every((t) => /^[a-z][a-z'.-]*\.?$/i.test(t))) return null;

  const titled = rest.map(titleCaseToken);
  const familyName = titled[titled.length - 1];
  const givenName = titled[0];
  const middleName = titled.length > 2 ? titled.slice(1, -1).join(" ") : undefined;
  const displayName = titled.join(" ");
  const variants = [displayName];
  if (middleName) {
    const middleInitial = `${givenName} ${middleName.charAt(0)}. ${familyName}`;
    const withoutMiddle = `${givenName} ${familyName}`;
    variants.push(withoutMiddle, middleInitial);
  } else {
    variants.push(`${givenName.charAt(0)}. ${familyName}`);
  }
  variants.push(`${familyName}, ${givenName}`);

  return {
    honorific,
    givenName,
    middleName,
    familyName,
    displayName,
    variants: [...new Set(variants)],
  };
}

function parseUsAddress(raw: string): {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
} | null {
  const trimmed = raw.trim();
  const zipMatch = trimmed.match(/\b(\d{5})(?:-\d{4})?\b/);
  const hasStreet = new RegExp(`\\b\\d{1,6}\\s+[^,]*\\b${STREET_SUFFIX}\\.?\\b`, "i").test(trimmed);
  if (!hasStreet) return null;
  if (!zipMatch && !/\b[A-Z]{2}\b/.test(trimmed) && !/,/.test(trimmed)) return null;

  const zip = zipMatch?.[1];
  let remainder = trimmed;
  if (zipMatch) remainder = remainder.replace(zipMatch[0], "").trim().replace(/,\s*$/, "");

  const parts = remainder.split(",").map((p) => p.trim()).filter(Boolean);
  let street: string | undefined;
  let city: string | undefined;
  let state: string | undefined;

  if (parts.length >= 3) {
    street = parts[0];
    city = parts[1];
    state = stateCodeFromText(parts[2].split(/\s+/)[0] ?? "") ?? parts[2].slice(0, 2).toUpperCase();
  } else if (parts.length === 2) {
    street = parts[0];
    const tail = parts[1];
    const tailBits = tail.split(/\s+/);
    const maybeState = tailBits[tailBits.length - 1];
    const code = maybeState ? stateCodeFromText(maybeState) : undefined;
    if (code) {
      state = code;
      city = tailBits.slice(0, -1).join(" ") || undefined;
    } else {
      city = tail;
    }
  } else {
    street = remainder;
    const stateMatch = remainder.match(/\b([A-Z]{2})\b/);
    if (stateMatch) state = stateCodeFromText(stateMatch[1]);
  }

  if (!street) return null;
  return { street, city, state, zip };
}

function parsePhone(raw: string): PhoneNumber | undefined {
  const trimmed = raw.trim();
  const compact = trimmed.replace(/[().\s-]/g, "");
  const candidates = [
    parsePhoneNumberFromString(trimmed, "US"),
    compact.startsWith("+") ? parsePhoneNumberFromString(trimmed) : undefined,
    /^\d{10}$/.test(compact) ? parsePhoneNumberFromString(`+1${compact}`) : undefined,
    compact.startsWith("1") && compact.length === 11 ? parsePhoneNumberFromString(`+${compact}`) : undefined,
  ];
  const valid = candidates.find((p) => p?.isValid());
  if (valid) return valid;
  return candidates.find((p) => p?.isPossible());
}

function hostnameFromUrl(value: string): string | undefined {
  try {
    const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(href);
    return url.hostname.replace(/^www\./i, "");
  } catch {
    return undefined;
  }
}

function uniqueTypes(types: QueryType[]): QueryType[] {
  return [...new Set(types)];
}

function applyFilters(classified: ClassifiedQuery, filters?: SearchFilters): ClassifiedQuery {
  if (!filters) return classified;
  const next = { ...classified };
  if (filters.city && !next.city) next.city = filters.city;
  if (filters.state && !next.state) next.state = filters.state;
  if (filters.username) {
    const handle = filters.username.replace(/^@/, "");
    if (!next.username) next.username = handle;
    if (!next.secondaryTypes.includes("username") && next.type !== "username") {
      next.secondaryTypes = uniqueTypes([...next.secondaryTypes, "username"]);
    }
  }
  return next;
}

export function classifyQuery(input: string, filters?: SearchFilters): ClassifiedQuery {
  const raw = input;
  const trimmed = input.trim();

  const rejected = (label: string): ClassifiedQuery => ({
    type: "unknown",
    secondaryTypes: [],
    raw,
    normalized: trimmed,
    confidence: "high",
    rejected: "ssn",
    label,
  });

  if (!trimmed) {
    return {
      type: "unknown",
      secondaryTypes: [],
      raw,
      normalized: "",
      confidence: "low",
      label: "Enter a name, email, phone, username, address, domain, or IP",
    };
  }

  if (looksLikeSsn(trimmed)) {
    return rejected(TYPE_LABELS.ssn);
  }

  if (/^https?:\/\//i.test(trimmed) || /^www\./i.test(trimmed)) {
    const host = hostnameFromUrl(trimmed);
    const secondary: QueryType[] = [];
    const extra: Partial<ClassifiedQuery> = {};
    if (host && IPV4_RE.test(host)) {
      secondary.push("ipv4");
      extra.ipv4 = host;
    } else if (host && isIPv6(host)) {
      secondary.push("ipv6");
      extra.ipv6 = host;
    } else if (host && DOMAIN_RE.test(host)) {
      secondary.push("domain");
      extra.domain = host.toLowerCase();
    }
    return applyFilters(
      {
        type: "url",
        secondaryTypes: uniqueTypes(secondary),
        raw,
        normalized: /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
        confidence: "high",
        url: /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
        label: TYPE_LABELS.url,
        ...extra,
      },
      filters,
    );
  }

  if (isIPv6(trimmed)) {
    return applyFilters(
      {
        type: "ipv6",
        secondaryTypes: [],
        raw,
        normalized: trimmed,
        confidence: "high",
        ipv6: trimmed,
        label: TYPE_LABELS.ipv6,
      },
      filters,
    );
  }

  if (IPV4_RE.test(trimmed)) {
    return applyFilters(
      {
        type: "ipv4",
        secondaryTypes: [],
        raw,
        normalized: trimmed,
        confidence: "high",
        ipv4: trimmed,
        label: TYPE_LABELS.ipv4,
      },
      filters,
    );
  }

  if (trimmed.includes("@") && EMAIL_RE.test(trimmed) && trimmed.split("@").length === 2) {
    const email = trimmed.toLowerCase();
    const [local, domain] = email.split("@");
    const secondary: QueryType[] = [];
    if (domain && DOMAIN_RE.test(domain)) secondary.push("domain");
    if (local && USERNAME_RE.test(local)) secondary.push("username");
    return applyFilters(
      {
        type: "email",
        secondaryTypes: uniqueTypes(secondary),
        raw,
        normalized: email,
        confidence: "high",
        email,
        domain,
        username: local,
        label: TYPE_LABELS.email,
      },
      filters,
    );
  }

  const phone = parsePhone(trimmed);
  if (phone) {
    const e164 = phone.number;
    const digits = e164.replace(/\D/g, "");
    return applyFilters(
      {
        type: "phone",
        secondaryTypes: [],
        raw,
        normalized: e164,
        confidence: "high",
        phoneE164: e164,
        phoneNational: phone.formatNational(),
        phoneDigits: digits,
        label: phone.country === "US" ? TYPE_LABELS.phone : "Looks like a phone number",
      },
      filters,
    );
  }

  const address = parseUsAddress(trimmed);
  if (address) {
    return applyFilters(
      {
        type: "us_address",
        secondaryTypes: [],
        raw,
        normalized: trimmed,
        confidence: "medium",
        addressRaw: trimmed,
        street: address.street,
        city: address.city,
        state: address.state,
        zip: address.zip,
        label: TYPE_LABELS.us_address,
      },
      filters,
    );
  }

  if (DOMAIN_RE.test(trimmed) && !trimmed.includes(" ")) {
    return applyFilters(
      {
        type: "domain",
        secondaryTypes: [],
        raw,
        normalized: trimmed.toLowerCase(),
        confidence: "high",
        domain: trimmed.toLowerCase(),
        label: TYPE_LABELS.domain,
      },
      filters,
    );
  }

  const person = parsePersonName(trimmed);
  if (person) {
    return applyFilters(
      {
        type: "person_name",
        secondaryTypes: [],
        raw,
        normalized: person.displayName,
        confidence: "medium",
        honorific: person.honorific,
        givenName: person.givenName,
        middleName: person.middleName,
        familyName: person.familyName,
        displayName: person.displayName,
        nameVariants: person.variants,
        label: TYPE_LABELS.person_name,
      },
      filters,
    );
  }

  if (USERNAME_RE.test(trimmed) && !trimmed.includes(" ")) {
    const username = trimmed.replace(/^@/, "");
    return applyFilters(
      {
        type: "username",
        secondaryTypes: [],
        raw,
        normalized: username,
        confidence: trimmed.startsWith("@") ? "high" : "medium",
        username,
        label: TYPE_LABELS.username,
      },
      filters,
    );
  }

  return applyFilters(
    {
      type: "unknown",
      secondaryTypes: [],
      raw,
      normalized: trimmed,
      confidence: "low",
      label: TYPE_LABELS.unknown,
    },
    filters,
  );
}

export function allTypes(classified: ClassifiedQuery): QueryType[] {
  return uniqueTypes([classified.type, ...classified.secondaryTypes]);
}

export function typeTitle(type: QueryType): string {
  switch (type) {
    case "email":
      return "email";
    case "phone":
      return "phone";
    case "person_name":
      return "person name";
    case "username":
      return "username";
    case "us_address":
      return "US address";
    case "domain":
      return "domain";
    case "ipv4":
      return "IPv4";
    case "ipv6":
      return "IPv6";
    case "url":
      return "URL";
    default:
      return "unclassified";
  }
}
