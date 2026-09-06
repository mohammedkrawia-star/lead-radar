import { db } from "@/db";
import { leads, lists, workflows } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
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
  workflowPrice: workflows.price,
  listId: leads.listId,
  phone: leads.phone,
  website: leads.website,
  address: leads.address,
  source: leads.source,
  notes: leads.notes,
  lastContactAt: leads.lastContactAt,
  createdAt: leads.createdAt,
};

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const listId = Number(id);
  if (!Number.isFinite(listId)) {
    return Response.json({ error: "معرّف غير صالح" }, { status: 400 });
  }

  const [list] = await db.select().from(lists).where(eq(lists.id, listId));
  if (!list) return Response.json({ error: "القائمة غير موجودة" }, { status: 404 });

  const rows = await db
    .select(leadSelect)
    .from(leads)
    .leftJoin(workflows, eq(leads.workflowId, workflows.id))
    .where(eq(leads.listId, listId))
    .orderBy(desc(leads.score), desc(leads.createdAt));

  return Response.json({ list, leads: rows });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const listId = Number(id);
  if (!Number.isFinite(listId)) {
    return Response.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return Response.json({ error: "اسم القائمة مطلوب" }, { status: 400 });
  }

  const [row] = await db
    .update(lists)
    .set({ name })
    .where(eq(lists.id, listId))
    .returning();
  if (!row) return Response.json({ error: "القائمة غير موجودة" }, { status: 404 });
  return Response.json({ list: row });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const listId = Number(id);
  if (!Number.isFinite(listId)) {
    return Response.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const [row] = await db.delete(lists).where(eq(lists.id, listId)).returning();
  if (!row) return Response.json({ error: "القائمة غير موجودة" }, { status: 404 });
  return Response.json({ ok: true });
}
