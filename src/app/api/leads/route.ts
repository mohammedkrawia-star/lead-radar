import { db } from "@/db";
import { leads, lists, workflows } from "@/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const leadSelect = {
  id: leads.id,
  businessName: leads.businessName,
  contactName: leads.contactName,
  contactRole: leads.contactRole,
  industry: leads.industry,
  city: leads.city,
  channel: leads.channel,
  size: leads.size,
  painPoint: leads.painPoint,
  score: leads.score,
  status: leads.status,
  dealValue: leads.dealValue,
  workflowId: leads.workflowId,
  workflowName: workflows.name,
  listId: leads.listId,
  listName: lists.name,
  phone: leads.phone,
  whatsapp: leads.whatsapp,
  instagram: leads.instagram,
  website: leads.website,
  address: leads.address,
  source: leads.source,
  notes: leads.notes,
  lastContactAt: leads.lastContactAt,
  createdAt: leads.createdAt,
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const industry = sp.get("industry");
  const q = sp.get("q")?.trim();
  const listId = sp.get("listId");

  const conds = [];
  if (status && status !== "all") {
    conds.push(eq(leads.status, status as (typeof leads.status.enumValues)[number]));
  }
  if (industry && industry !== "all") {
    conds.push(eq(leads.industry, industry));
  }
  if (listId) {
    conds.push(eq(leads.listId, Number(listId)));
  }
  if (q) {
    conds.push(
      or(
        ilike(leads.businessName, `%${q}%`),
        ilike(leads.contactName, `%${q}%`),
        ilike(leads.city, `%${q}%`),
      ),
    );
  }

  const rows = await db
    .select(leadSelect)
    .from(leads)
    .leftJoin(workflows, eq(leads.workflowId, workflows.id))
    .leftJoin(lists, eq(leads.listId, lists.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(leads.score), desc(leads.createdAt));

  const stats = await db
    .select({
      status: leads.status,
      count: sql<number>`count(*)::int`,
      value: sql<number>`coalesce(sum(${leads.dealValue}),0)::int`,
    })
    .from(leads)
    .groupBy(leads.status);

  return Response.json({ leads: rows, stats });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.businessName || !body?.industry) {
    return Response.json(
      { error: "businessName و industry مطلوبين" },
      { status: 400 },
    );
  }

  const [row] = await db
    .insert(leads)
    .values({
      businessName: String(body.businessName),
      contactName: String(body.contactName ?? ""),
      contactRole: String(body.contactRole ?? ""),
      industry: String(body.industry),
      city: String(body.city ?? ""),
      channel: String(body.channel ?? "whatsapp"),
      size: String(body.size ?? "small"),
      painPoint: String(body.painPoint ?? ""),
      score: Math.max(0, Math.min(100, Number(body.score ?? 50))),
      status: "new",
      dealValue: Number(body.dealValue ?? 0),
      workflowId: body.workflowId ? Number(body.workflowId) : null,
      phone: body.phone ? String(body.phone) : null,
      whatsapp: body.whatsapp ? String(body.whatsapp) : null,
      instagram: body.instagram ? String(body.instagram) : null,
      website: body.website ? String(body.website) : null,
      address: body.address ? String(body.address) : null,
      source: "manual",
      notes: body.notes ? String(body.notes) : null,
    })
    .returning();

  return Response.json({ lead: row }, { status: 201 });
}
