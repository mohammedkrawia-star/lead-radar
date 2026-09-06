// Real prospect discovery via OpenStreetMap (Nominatim + Overpass API).
// No API key required — public open data (ODbL).

import { INDUSTRY_INTEL } from "./scout-data";

const UA = "LeadRadar/1.0 (lead prospecting dashboard)";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

/** industry → OSM tag pairs that represent real businesses in that field */
export const INDUSTRY_TAGS: Record<string, [string, string][]> = {
  ecommerce: [
    ["shop", "fashion"],
    ["shop", "clothes"],
    ["shop", "perfume"],
    ["shop", "cosmetics"],
    ["shop", "jewelry"],
    ["shop", "bags"],
  ],
  clinic: [
    ["amenity", "clinic"],
    ["amenity", "doctors"],
    ["amenity", "dentist"],
    ["healthcare", "clinic"],
  ],
  realestate: [["office", "estate_agent"]],
  restaurant: [
    ["amenity", "restaurant"],
    ["amenity", "cafe"],
    ["amenity", "fast_food"],
  ],
  agency: [
    ["office", "advertising_agency"],
    ["office", "marketing"],
    ["office", "it"],
  ],
  education: [
    ["amenity", "language_school"],
    ["amenity", "school"],
    ["amenity", "prep_school"],
    ["office", "educational_institution"],
  ],
  logistics: [["office", "logistics"]],
  beauty: [
    ["shop", "beauty"],
    ["shop", "hairdresser"],
    ["shop", "massage"],
  ],
};

export interface RealProspect {
  businessName: string;
  contactName: string;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  website: string | null;
  address: string | null;
  industry: string;
  channel: string;
  size: string;
  score: number;
  osmRef: string;
}

interface OsmElement {
  type: string;
  id: number;
  tags?: Record<string, string>;
}

export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

async function geocodeCityNominatim(
  city: string,
): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=ar&q=${encodeURIComponent(city)}`;
    const res = await withTimeout(
      fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" }),
      8000,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { lat: string; lon: string }[];
    if (!data?.length) return null;
    return { lat: Number(data[0].lat), lon: Number(data[0].lon) };
  } catch {
    return null;
  }
}

// Secondary geocoder — Nominatim's usage policy is strict about automated /
// cloud traffic and will sometimes reject requests coming from serverless
// IP ranges. Photon (Komoot, also OSM-backed, no key needed) is a
// good-faith fallback so a single blocked provider doesn't kill the feature.
async function geocodeCityPhoton(
  city: string,
): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `https://photon.komoot.io/api/?lang=ar&limit=1&q=${encodeURIComponent(city)}`;
    const res = await withTimeout(
      fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" }),
      8000,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: { geometry?: { coordinates?: [number, number] } }[];
    };
    const coords = data.features?.[0]?.geometry?.coordinates;
    if (!coords) return null;
    return { lat: coords[1], lon: coords[0] };
  } catch {
    return null;
  }
}

async function geocodeCity(
  city: string,
): Promise<{ lat: number; lon: number } | null> {
  return (await geocodeCityNominatim(city)) ?? (await geocodeCityPhoton(city));
}

async function queryOverpass(
  lat: number,
  lon: number,
  tagPairs: [string, string][],
): Promise<OsmElement[]> {
  const parts = tagPairs
    .map(([k, v]) => `nwr["${k}"="${v}"](around:8000,${lat},${lon});`)
    .join("");
  const query = `[out:json][timeout:20];(${parts});out tags center 80;`;

  // Race all mirrors concurrently instead of one-by-one — a single slow or
  // blocked mirror should not eat the whole request budget serially.
  const attempts = OVERPASS_ENDPOINTS.map(async (endpoint) => {
    const res = await withTimeout(
      fetch(endpoint, {
        method: "POST",
        headers: {
          "User-Agent": UA,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(query)}`,
        cache: "no-store",
      }),
      18000,
    );
    if (!res.ok) throw new Error(`${endpoint} -> HTTP ${res.status}`);
    const data = (await res.json()) as { elements?: OsmElement[] };
    if (!data.elements) throw new Error(`${endpoint} -> no elements`);
    return data.elements;
  });

  const results = await Promise.allSettled(attempts);
  const ok = results.find(
    (r): r is PromiseFulfilledResult<OsmElement[]> => r.status === "fulfilled",
  );
  if (ok) return ok.value;

  const reasons = results
    .map((r) => (r.status === "rejected" ? String(r.reason) : null))
    .filter(Boolean)
    .join(" | ");
  throw new Error(`all overpass endpoints failed: ${reasons}`);
}

export function firstTag(
  tags: Record<string, string>,
  keys: string[],
): string | null {
  for (const k of keys) {
    const v = tags[k];
    if (v && v.trim()) return v.trim();
  }
  return null;
}

export function normalizeWebsite(url: string | null): string | null {
  if (!url) return null;
  const clean = url.split(";")[0].trim();
  if (!clean) return null;
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
}

export function normalizePhone(raw: string | null): string | null {
  if (!raw) return null;
  let v = raw.split(";")[0].trim();
  if (!v) return null;
  // contact:whatsapp is often a wa.me URL — extract the number
  const m = v.match(/wa\.me\/(\+?\d+)/i);
  if (m) return m[1].startsWith("+") ? m[1] : `+${m[1]}`;
  v = v.replace(/^tel:/i, "").trim();
  return v.length >= 6 ? v : null;
}

/**
 * OSM's contact:instagram tag shows up in wildly inconsistent shapes:
 * a bare handle ("some.cafe"), an "@handle", or a full profile URL with or
 * without query params. Normalize all of them into one clickable profile
 * link so the UI never has to guess.
 */
export function normalizeInstagram(raw: string | null): string | null {
  if (!raw) return null;
  let v = raw.split(";")[0].trim();
  if (!v) return null;
  v = v.replace(/^@/, "");
  const urlMatch = v.match(/instagram\.com\/([^/?#\s]+)/i);
  if (urlMatch) v = urlMatch[1];
  v = v.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  if (!v || /^(instagram\.com)?$/i.test(v)) return null;
  return `https://instagram.com/${v}`;
}

export function buildAddress(tags: Record<string, string>): string | null {
  const parts = [
    tags["addr:neighbourhood"],
    tags["addr:street"],
    tags["addr:housenumber"],
    tags["addr:city"],
    tags["addr:housename"],
  ].filter((p): p is string => !!p && !!p.trim());
  const unique = [...new Set(parts.map((p) => p.trim()))];
  return unique.length ? unique.slice(0, 3).join("، ") : null;
}

// Only ever labeled "whatsapp" when OSM explicitly tags a WhatsApp contact
// (contact:whatsapp) — a plain phone/mobile number is NOT assumed to be
// WhatsApp-capable, since that used to send a "واتساب" button straight to
// landlines and other numbers that were never actually on WhatsApp.
export function pickChannel(tags: Record<string, string>): string {
  if (tags["contact:whatsapp"]) return "whatsapp";
  if (tags["contact:instagram"]) return "instagram";
  if (tags["phone"] || tags["contact:phone"] || tags["contact:mobile"])
    return "phone";
  if (tags["contact:facebook"]) return "email";
  return "email";
}

export function scoreTags(tags: Record<string, string>): number {
  let s = 48;
  const hasPhone =
    tags["phone"] || tags["contact:phone"] || tags["contact:mobile"];
  const hasWeb =
    tags["website"] || tags["contact:website"] || tags["url"];
  const hasSocial =
    tags["contact:instagram"] ||
    tags["contact:facebook"] ||
    tags["contact:whatsapp"];

  if (hasPhone) s += 18; // reachable = closer to a deal
  if (!hasWeb) s += 13; // weak digital presence = needs automation
  if (hasSocial) s += 8;
  if (tags["addr:street"]) s += 4;
  s += Math.floor(Math.random() * 15);
  return Math.min(96, s);
}

/**
 * Fetch real businesses near a city for the given industries.
 * Throws if no real data could be retrieved (caller should fall back).
 */
export async function fetchRealProspects(
  industries: string[],
  city: string,
  count: number,
  exclude: Set<string>,
): Promise<RealProspect[]> {
  const geo = await geocodeCity(city);
  if (!geo) throw new Error("geocoding failed");

  // merge tag pairs of the chosen industries (dedup)
  const seenPairs = new Set<string>();
  const tagPairs: [string, string][] = [];
  for (const ind of industries) {
    for (const pair of INDUSTRY_TAGS[ind] ?? []) {
      const key = pair.join("=");
      if (!seenPairs.has(key)) {
        seenPairs.add(key);
        tagPairs.push(pair);
      }
    }
  }
  if (!tagPairs.length) throw new Error("no tags for industry");

  const elements = await queryOverpass(geo.lat, geo.lon, tagPairs);

  const tagToIndustry = new Map<string, string>();
  for (const ind of industries) {
    for (const [k, v] of INDUSTRY_TAGS[ind] ?? []) {
      tagToIndustry.set(`${k}=${v}`, ind);
    }
  }

  const seenNames = new Set<string>();
  const prospects: RealProspect[] = [];

  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = firstTag(tags, ["name:ar", "name", "name:en", "brand"]);
    if (!name || name.length < 3) continue;

    // skip generic/chain noise — chains rarely buy freelance automation
    if (
      /costa|starbucks|mcdonald|kfc|pizza hut|domino|burger king|hardee|subway|tim horton|dunkin|carrefour|spinneys|ikea|h&m|zara\b/i.test(
        name,
      )
    )
      continue;

    const dedupeKey = name.replace(/\s+/g, " ").trim().toLowerCase();
    if (seenNames.has(dedupeKey) || exclude.has(dedupeKey)) continue;
    seenNames.add(dedupeKey);

    // figure out which industry this element belongs to
    let industry: string | null = null;
    for (const [k, v] of Object.entries(tags)) {
      const mapped = tagToIndustry.get(`${k}=${v}`);
      if (mapped) {
        industry = mapped;
        break;
      }
    }
    if (!industry) continue;

    prospects.push({
      businessName: name,
      contactName: firstTag(tags, ["contact:name", "operator", "owner"]) ?? "",
      phone: normalizePhone(
        firstTag(tags, ["contact:mobile", "phone", "contact:phone"]),
      ),
      whatsapp: normalizePhone(firstTag(tags, ["contact:whatsapp"])),
      instagram: normalizeInstagram(firstTag(tags, ["contact:instagram"])),
      website: normalizeWebsite(
        firstTag(tags, ["contact:website", "website", "url"]),
      ),
      address: buildAddress(tags),
      industry,
      channel: pickChannel(tags),
      size: "small",
      score: scoreTags(tags),
      osmRef: `${el.type}/${el.id}`,
    });
  }

  // shuffle, then keep ONLY prospects with at least one real, actionable
  // contact method — a business we found but can't actually reach isn't
  // useful in a CRM meant for outreach, so it's dropped instead of padding
  // the result count with dead ends.
  for (let i = prospects.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [prospects[i], prospects[j]] = [prospects[j], prospects[i]];
  }
  const withContact = prospects.filter(
    (p) => p.phone || p.whatsapp || p.instagram || p.website,
  );
  const picked = withContact.slice(0, count);
  if (!picked.length)
    throw new Error("no contactable businesses found (osm)");
  return picked;
}

export function painFor(industry: string): string {
  const pains = INDUSTRY_INTEL[industry]?.pains ?? INDUSTRY_INTEL.ecommerce.pains;
  return pains[Math.floor(Math.random() * pains.length)];
}

export function workflowFor(industry: string): string {
  const wfs =
    INDUSTRY_INTEL[industry]?.workflows ?? INDUSTRY_INTEL.ecommerce.workflows;
  return wfs[Math.floor(Math.random() * wfs.length)];
}
