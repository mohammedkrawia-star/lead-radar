import { db } from "@/db";
import { leads, leadStatusEnum } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const leadId = Number(id);
  if (!Number.isFinite(leadId)) {
    return Response.json({ error: "معرّف غير صالح" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "جسم الطلب فارغ" }, { status: 400 });

  const patch: Partial<typeof leads.$inferInsert> = {};
  const allowedText = [
    "businessName",
    "contactName",
    "contactRole",
    "industry",
    "city",
    "channel",
    "size",
    "painPoint",
  ] as const;
  for (const key of allowedText) {
    if (key in body) patch[key] = String(body[key]);
  }
  const nullableText = ["phone", "website", "address", "notes"] as const;
  for (const key of nullableText) {
    if (key in body) {
      patch[key] = body[key] === null || body[key] === "" ? null : String(body[key]);
    }
  }
  if ("score" in body)
    patch.score = Math.max(0, Math.min(100, Number(body.score)));
  if ("dealValue" in body) patch.dealValue = Math.max(0, Number(body.dealValue));
  if ("workflowId" in body)
    patch.workflowId = body.workflowId ? Number(body.workflowId) : null;
  if ("listId" in body)
    patch.listId = body.listId ? Number(body.listId) : null;

  if ("status" in body) {
    const status = String(body.status);
    if (!leadStatusEnum.enumValues.includes(status as never)) {
      return Response.json({ error: "حالة غير معروفة" }, { status: 400 });
    }
    patch.status = status as (typeof leadStatusEnum.enumValues)[number];
    if (status !== "new" && !body.keepLastContact) {
      patch.lastContactAt = new Date();
    }
  }

  const [row] = await db
    .update(leads)
    .set(patch)
    .where(eq(leads.id, leadId))
    .returning();

  if (!row) return Response.json({ error: "العميل غير موجود" }, { status: 404 });
  return Response.json({ lead: row });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const leadId = Number(id);
  if (!Number.isFinite(leadId)) {
    return Response.json({ error: "معرّف غير صالح" }, { status: 400 });
  }
  const [row] = await db.delete(leads).where(eq(leads.id, leadId)).returning();
  if (!row) return Response.json({ error: "العميل غير موجود" }, { status: 404 });
  return Response.json({ ok: true });
}
