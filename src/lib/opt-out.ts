/**
 * Official self-service opt-out destinations only.
 * Plainview never submits these forms. URLs move — treat each homepage
 * footer (“Opt out” / “Do not sell”) as the fallback if a path 404s.
 */
export type OptOutBroker = {
  id: string;
  name: string;
  homepage: string;
  optOutUrl: string;
  method: string;
  asksFor: string;
  confirm: string;
  typicalLag: string;
  mayReturn: boolean;
  notes: string;
};

export const OPT_OUT_BROKERS: OptOutBroker[] = [
  {
    id: "truepeoplesearch",
    name: "TruePeopleSearch",
    homepage: "https://www.truepeoplesearch.com/",
    optOutUrl: "https://www.truepeoplesearch.com/removal",
    method: "Official removal page and/or Remove on your own profile",
    asksFor: "The listing that is you; sometimes an email",
    confirm: "Follow any email or on-page confirm they show",
    typicalLag: "Often within a few days",
    mayReturn: true,
    notes: "Clearing this site does nothing to FastPeopleSearch. They are separate companies.",
  },
  {
    id: "fastpeoplesearch",
    name: "FastPeopleSearch",
    homepage: "https://www.fastpeoplesearch.com/",
    optOutUrl: "https://www.fastpeoplesearch.com/removal",
    method: "Official removal page; pick your listing, then remove",
    asksFor: "Email, name, city/state of the listing that is you",
    confirm: "Click the link in their email if they send one (some links expire in about a day)",
    typicalLag: "Hours to a few days",
    mayReturn: true,
    notes: "Independent of TruePeopleSearch. Repeat for old cities and name spellings.",
  },
  {
    id: "thatsthem",
    name: "That'sThem",
    homepage: "https://thatsthem.com/",
    optOutUrl: "https://thatsthem.com/",
    method: "Open your own profile, use Opt Out at the bottom",
    asksFor: "Email plus CAPTCHA on their form",
    confirm: "Click the confirmation link they email you",
    typicalLag: "About 1–2 days after you confirm",
    mayReturn: true,
    notes: "There is no useful pre-filled opt-out URL. Find your listing first, then opt out there.",
  },
  {
    id: "whitepages",
    name: "Whitepages",
    homepage: "https://www.whitepages.com/",
    optOutUrl: "https://www.whitepages.com/suppression-requests",
    method: "Suppression request form",
    asksFor: "URL of your listing; phone verification is the usual fast path",
    confirm: "Phone or email verification on their side",
    typicalLag: "Hours to a few days",
    mayReturn: true,
    notes: "Use a number you control. Do not use someone else’s phone to “verify.”",
  },
  {
    id: "familytreenow",
    name: "FamilyTreeNow",
    homepage: "https://www.familytreenow.com/",
    optOutUrl: "https://www.familytreenow.com/optout",
    method: "Opt-out search on their official page, then Opt Out This Record",
    asksFor: "Name and state; CAPTCHA; often an email",
    confirm: "Click the email link if they send one",
    typicalLag: "Up to about 72 hours after confirm",
    mayReturn: true,
    notes: "Each person is a separate row. Removing you does not remove relatives who still list you.",
  },
  {
    id: "nuwber",
    name: "Nuwber",
    homepage: "https://nuwber.com/",
    optOutUrl: "https://nuwber.com/removal",
    method: "Removal form that wants the person-page URL",
    asksFor: "Your listing URL and contact email",
    confirm: "They may email back more than once",
    typicalLag: "Several days; follow up if silent",
    mayReturn: true,
    notes: "Filter by state on the site so you submit the URL that is actually you.",
  },
  {
    id: "usphonebook",
    name: "USPhoneBook",
    homepage: "https://www.usphonebook.com/",
    optOutUrl: "https://www.usphonebook.com/removal",
    method: "Removal form; email fallback if the form hangs",
    asksFor: "Name and email; choose that you are the subject of the request",
    confirm: "Open the emailed form link within about a day",
    typicalLag: "Days; they treat removal as a courtesy and say records can return",
    mayReturn: true,
    notes: "If the form fails, their published fallback is support+optout@usphonebook.com — still only for your own listing.",
  },
  {
    id: "spokeo",
    name: "Spokeo",
    homepage: "https://www.spokeo.com/",
    optOutUrl: "https://www.spokeo.com/optout",
    method: "Opt-out page: paste your listing URL",
    asksFor: "Profile URL plus email",
    confirm: "Click the link they email you",
    typicalLag: "About 1–3 days after confirm",
    mayReturn: true,
    notes: "Paid/advanced people-search aggregator. Included here only so you can remove yourself.",
  },
];

export const OPT_OUT_NOT_IN_SCOPE = [
  {
    name: "Search engines (Google, DuckDuckGo, Bing)",
    reason: "They index other sites. Use each engine’s own results-about-you tools if offered. That is not the same as deleting a broker row.",
  },
  {
    name: "Have I Been Pwned, Dehashed, Intelligence X",
    reason: "Breach indexes describe dumps that already leaked. You cannot erase the dump through Plainview.",
  },
  {
    name: "CourtListener, FEC, OpenCorporates, county assessors",
    reason: "Public records and dockets generally stay public. An assessor listing is not a people-search opt-out.",
  },
  {
    name: "Social networks and GitHub",
    reason: "Change privacy or delete the account on that site. Username checkers (WhatsMyName, Namechk) have nothing to suppress.",
  },
  {
    name: "PimEyes, Maltego, Shodan, OSINT Industries",
    reason: "Different products with their own processes. Plainview does not upload faces or run those tools.",
  },
];

export const OPT_OUT_STORAGE_KEY = "plainview-optout";
export type ChecklistStatus = "idle" | "requested" | "confirmed" | "gone" | "returned";

export const CHECKLIST_STATUSES: { id: ChecklistStatus; label: string }[] = [
  { id: "idle", label: "Not started" },
  { id: "requested", label: "Opened their form" },
  { id: "confirmed", label: "I confirmed their email/phone" },
  { id: "gone", label: "Listing looks gone" },
  { id: "returned", label: "It came back" },
];
