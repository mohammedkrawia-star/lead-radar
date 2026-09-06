// Real prospect discovery via the Geoapify Places API (also OSM-sourced,
// https://apidocs.geoapify.com/docs/places/). This is the PRIMARY real-data
// path when GEOAPIFY_API_KEY is configured.
//
// Why this exists alongside real-scout.ts (raw Nominatim + Overpass):
// public Nominatim/Overpass instances frequently rate-limit or outright
// block requests coming from cloud/serverless IP ranges (Vercel, AWS
// Lambda, etc.) because of their strict "no heavy automated use" policy.
// Geoapify is a commercial gateway over the same OSM data that is built to
// be called from servers, so it does not have that problem — you just need
// a free API key (3,000 requests/day, no credit card):
//   1. https://myprojects.geoapify.com/ → sign up
//   2. Create a project → API Keys tab → copy the key
//   3. Set GEOAPIFY_API_KEY in Vercel → Project → Settings → Environment
//      Variables (Production + Preview), then redeploy.
//
// If GEOAPIFY_API_KEY isn't set, the scout route falls back to the free
// real-scout.ts (Nominatim/Overpass) path, and finally to simulated data.

import {
  firstTag,
  normalizeWebsite,
  normalizePhone,
  buildAddress,
  pickChannel,
  scoreTags,
  withTimeout,
  type RealProspect,
} from "./real-scout";

const UA = "LeadRadar/1.0 (lead prospecting dashboard)";

/** industry → Geoapify Places category keys (see apidocs.geoapify.com/docs/places/#categories) */
export const GEOAPIFY_CATEGORIES: Record<string, string[]> = {
  ecommerce: [
    "commercial.clothing",
    "commercial.jewelry",
    "commercial.health_and_beauty.cosmetics",
    "commercial.bag",
    "commercial.gift_and_souvenir",
  ],
  clinic: ["healthcare.clinic_or_praxis", "healthcare.dentist"],
  realestate: ["office.estate_agent", "service.estate_agent"],
  restaurant: ["catering.restaurant", "catering.cafe", "catering.fast_food"],
  agency: ["office.advertising_agency", "office.consulting", "office.it"],
  education: [
    "education.language_school",
    "education.school",
    "office.educational_institution",
  ],
  logistics: ["office.logistics"],
  beauty: ["service.beauty", "service.beauty.hairdresser", "service.beauty.massage"],
};

interface GeoapifyFeature {
  properties?: {
    name?: string;
    website?: string;
    place_id?: string;
    formatted?: string;
    contact?: { phone?: string; email?: string; website?: string };
    datasource?: { raw?: Record<string, string> };
  };
}

async function geocodeCityGeoapify(
  city: string,
  apiKey: string,
): Promise<{ lat: number; lon: number }> {
  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(city)}&format=json&limit=1&lang=ar&apiKey=${apiKey}`;
  const res = await withTimeout(
    fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" }),
    8000,
  );
  if (!res.ok) throw new Error(`geoapify geocode HTTP ${res.status}`);
  const data = (await res.json()) as {
    results?: { lat: number; lon: number }[];
  };
  const first = data.results?.[0];
  if (!first) throw new Error("geoapify geocode: no results for city");
  return { lat: first.lat, lon: first.lon };
}

async function searchGeoapifyCategory(
  lat: number,
  lon: number,
  category: string,
  apiKey: string,
): Promise<GeoapifyFeature[]> {
  const url =
    `https://api.geoapify.com/v2/places?categories=${encodeURIComponent(category)}` +
    `&filter=circle:${lon},${lat},8000&bias=proximity:${lon},${lat}&limit=40&lang=ar&apiKey=${apiKey}`;
  const res = await withTimeout(
    fetch(url, { headers: { "User-Agent": UA }, cache: "no-store" }),
    12000,
  );
  if (!res.ok) throw new Error(`geoapify places ${category} HTTP ${res.status}`);
  const data = (await res.json()) as { features?: GeoapifyFeature[] };
  return data.features ?? [];
}

/**
 * Fetch real businesses near a city for the given industries via Geoapify.
 * Throws if no real data could be retrieved (caller should fall back).
 */
export async function fetchGeoapifyProspects(
  industries: string[],
  city: string,
  count: number,
  exclude: Set<string>,
  apiKey: string,
): Promise<RealProspect[]> {
  const geo = await geocodeCityGeoapify(city, apiKey);

  const catToIndustry = new Map<string, string>();
  const categories: string[] = [];
  for (const ind of industries) {
    for (const cat of GEOAPIFY_CATEGORIES[ind] ?? []) {
      if (!catToIndustry.has(cat)) {
        catToIndustry.set(cat, ind);
        categories.push(cat);
      }
    }
  }
  if (!categories.length) throw new Error("no geoapify categories for industry");

  const settled = await Promise.allSettled(
    categories.map((c) => searchGeoapifyCategory(geo.lat, geo.lon, c, apiKey)),
  );

  const failures = settled.filter((r) => r.status === "rejected");
  if (failures.length === settled.length) {
    const reasons = settled
      .map((r) => (r.status === "rejected" ? String(r.reason) : ""))
      .join(" | ");
    throw new Error(`all geoapify category searches failed: ${reasons}`);
  }

  const seenNames = new Set<string>();
  const prospects: RealProspect[] = [];

  settled.forEach((result, i) => {
    if (result.status !== "fulfilled") return;
    const industry = catToIndustry.get(categories[i])!;

    for (const feature of result.value) {
      const props = feature.properties ?? {};
      const raw = props.datasource?.raw ?? {};
      // `raw` mirrors the original OSM tags (same shape Overpass returns),
      // so the existing tag-parsing helpers work unchanged here too.
      const tags: Record<string, string> = { ...raw };
      if (props.website && !tags.website) tags.website = props.website;
      if (props.contact?.phone && !tags.phone) tags.phone = props.contact.phone;
      if (props.contact?.website && !tags["contact:website"])
        tags["contact:website"] = props.contact.website;

      const name =
        firstTag(tags, ["name:ar", "name", "name:en", "brand"]) ?? props.name;
      if (!name || name.length < 3) continue;

      if (
        /costa|starbucks|mcdonald|kfc|pizza hut|domino|burger king|hardee|subway|tim horton|dunkin|carrefour|spinneys|ikea|h&m|zara\b/i.test(
          name,
        )
      )
        continue;

      const dedupeKey = name.replace(/\s+/g, " ").trim().toLowerCase();
      if (seenNames.has(dedupeKey) || exclude.has(dedupeKey)) continue;
      seenNames.add(dedupeKey);

      prospects.push({
        businessName: name,
        contactName: firstTag(tags, ["contact:name", "operator", "owner"]) ?? "",
        phone: normalizePhone(
          firstTag(tags, [
            "contact:whatsapp",
            "contact:mobile",
            "phone",
            "contact:phone",
          ]),
        ),
        website: normalizeWebsite(
          firstTag(tags, ["contact:website", "website", "url"]),
        ),
        address: buildAddress(tags) ?? props.formatted ?? null,
        industry,
        channel: pickChannel(tags),
        size: "small",
        score: scoreTags(tags),
        osmRef: props.place_id ? `geoapify/${props.place_id}` : "geoapify",
      });
    }
  });

  for (let i = prospects.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [prospects[i], prospects[j]] = [prospects[j], prospects[i]];
  }
  const withContact = prospects.filter((p) => p.phone || p.website);
  const withoutContact = prospects.filter((p) => !p.phone && !p.website);
  const picked = [...withContact, ...withoutContact].slice(0, count);
  if (!picked.length) throw new Error("no named businesses found (geoapify)");
  return picked;
}
