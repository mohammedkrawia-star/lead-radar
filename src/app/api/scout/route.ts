import { db } from "@/db";
import { leads, lists, workflows } from "@/db/schema";
import {
  fetchRealProspects,
  painFor,
  workflowFor,
} from "@/lib/real-scout";
import { fetchGeoapifyProspects } from "@/lib/geoapify-scout";
import { generateProspect, INDUSTRY_INTEL } from "@/lib/scout-data";
import { CITIES, INDUSTRY_LABEL } from "@/lib/constants";
import { eq, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

const ALL_INDUSTRIES = Object.keys(INDUSTRY_INTEL);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const industry =
    typeof body?.industry === "string" && body.industry !== "any"
      ? body.industry
      : undefined;
  const city =
    typeof body?.city === "string" && body.city !== "any"
      ? body.city
      : undefined;

  const cityUsed = city ?? CITIES[Math.floor(Math.random() * CITIES.length)];
  const industries = industry
    ? [industry]
    : [...ALL_INDUSTRIES].sort(() => Math.random() - 0.5).slice(0, 3);

  const COUNT = 5;

  // every scout run gets grouped into a named list — reuse a list if the
  // caller (or a previous run) already used this exact name, otherwise
  // auto-name it from the search so nothing is ever left unlabeled.
  const requestedListName =
    typeof body?.listName === "string" ? body.listName.trim() : "";
  const autoListName = `${cityUsed} — ${industries
    .map((i) => INDUSTRY_LABEL[i] ?? i)
    .join("، ")} — ${new Date().toLocaleDateString("ar-EG")}`;
  const listName = requestedListName || autoListName;

  let [list] = await db.select().from(lists).where(eq(lists.name, listName));
  if (!list) {
    [list] = await db
      .insert(lists)
      .values({ name: listName, city: cityUsed, industries })
      .returning();
  }

  // dedupe set: existing business names in this city
  const existing = await db
    .select({ businessName: leads.businessName })
    .from(leads)
    .where(inArray(leads.city, [cityUsed]));
  const exclude = new Set(
    existing.map((r) => r.businessName.replace(/\s+/g, " ").trim().toLowerCase()),
  );

  const wfRows = await db.select().from(workflows);
  const byName = new Map(wfRows.map((w) => [w.name, w]));

  let source: "geoapify" | "osm" | "simulated" = "simulated";
  let realProspects: Awaited<ReturnType<typeof fetchRealProspects>> = [];
  const failureReasons: string[] = [];

  const geoapifyKey = process.env.GEOAPIFY_API_KEY;
  if (geoapifyKey) {
    try {
      realProspects = await fetchGeoapifyProspects(
        industries,
        cityUsed,
        COUNT,
        exclude,
        geoapifyKey,
      );
      source = "geoapify";
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[scout] geoapify path failed:", msg);
      failureReasons.push(`geoapify: ${msg}`);
    }
  }

  if (!realProspects.length) {
    try {
      realProspects = await fetchRealProspects(industries, cityUsed, COUNT, exclude);
      source = "osm";
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[scout] osm (nominatim/overpass) path failed:", msg);
      failureReasons.push(`osm: ${msg}`);
      source = "simulated";
    }
  }

  const values: (typeof leads.$inferInsert)[] = [];

  if (source === "geoapify" || source === "osm") {
    for (const p of realProspects) {
      const wfName = workflowFor(p.industry);
      const wf = byName.get(wfName);
      const setup = 60 * Math.round(3 + Math.random() * 4);
      values.push({
        businessName: p.businessName,
        contactName: p.contactName,
        contactRole: "",
        industry: p.industry,
        city: cityUsed,
        channel: p.channel,
        size: p.size,
        painPoint: painFor(p.industry),
        score: p.score,
        status: "new",
        dealValue: (wf?.price ?? 300) + setup,
        workflowId: wf?.id ?? null,
        listId: list.id,
        phone: p.phone,
        website: p.website,
        address: p.address,
        source,
        notes: p.osmRef ? `OSM: ${p.osmRef}` : null,
      });
    }
  } else {
    // fallback — offline / no coverage: simulated prospects
    const usedNames = new Set<string>();
    for (let i = 0; i < 4; i++) {
      const ind = industries[i % industries.length];
      let p = generateProspect(ind, [cityUsed]);
      let guard = 0;
      while (
        (usedNames.has(p.businessName) ||
          exclude.has(p.businessName.trim().toLowerCase())) &&
        guard++ < 6
      ) {
        p = generateProspect(ind, [cityUsed]);
      }
      usedNames.add(p.businessName);
      const wf = byName.get(p.matchedWorkflow);
      values.push({
        businessName: p.businessName,
        contactName: p.contactName,
        contactRole: p.contactRole,
        industry: p.industry,
        city: p.city,
        channel: p.channel,
        size: p.size,
        painPoint: p.painPoint,
        score: p.score,
        status: "new",
        dealValue: (wf?.price ?? 300) + p.setupFee,
        workflowId: wf?.id ?? null,
        listId: list.id,
        source: "simulated",
      });
    }
  }

  const inserted = await db.insert(leads).values(values).returning();
  const payload = inserted
    .map((row) => ({
      ...row,
      workflowName: wfRows.find((w) => w.id === row.workflowId)?.name ?? null,
      workflowPrice: wfRows.find((w) => w.id === row.workflowId)?.price ?? null,
    }))
    .sort((a, b) => b.score - a.score);

  if (source === "simulated") {
    console.error(
      `[scout] falling back to simulated data for city="${cityUsed}". Reasons: ${failureReasons.join(" || ") || "no reasons captured"}`,
    );
  }

  return Response.json({
    leads: payload,
    source,
    cityUsed,
    industries,
    list: { id: list.id, name: list.name },
    // Only populated when real data failed — safe to ignore in the UI,
    // useful in the browser network tab / Vercel logs for diagnosis.
    ...(source === "simulated" && failureReasons.length
      ? { debugReason: failureReasons }
      : {}),
  });
}
