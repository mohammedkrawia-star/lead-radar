import { db } from "@/db";
import { leads, lists, workflows } from "@/db/schema";
import { INDUSTRY_LABEL, CHANNEL_LABEL, STATUS_META } from "@/lib/constants";
import { csvResponse, toCsv } from "@/lib/csv";
import { desc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const COLUMNS = [
  { key: "businessName", label: "اسم النشاط" },
  { key: "contactName", label: "جهة الاتصال" },
  { key: "contactRole", label: "الدور" },
  { key: "industry", label: "المجال" },
  { key: "city", label: "المدينة" },
  { key: "address", label: "العنوان" },
  { key: "phone", label: "التليفون" },
  { key: "website", label: "الموقع" },
  { key: "channel", label: "قناة التواصل" },
  { key: "status", label: "الحالة" },
  { key: "score", label: "التقييم" },
  { key: "dealValue", label: "قيمة الصفقة ($)" },
  { key: "workflowName", label: "الورك فلو المقترح" },
  { key: "painPoint", label: "المشكلة المتوقعة" },
  { key: "notes", label: "ملاحظات" },
  { key: "createdAt", label: "تاريخ الإضافة" },
];

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
    .select({
      businessName: leads.businessName,
      contactName: leads.contactName,
      contactRole: leads.contactRole,
      industry: leads.industry,
      city: leads.city,
      address: leads.address,
      phone: leads.phone,
      website: leads.website,
      channel: leads.channel,
      status: leads.status,
      score: leads.score,
      dealValue: leads.dealValue,
      workflowName: workflows.name,
      painPoint: leads.painPoint,
      notes: leads.notes,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .leftJoin(workflows, eq(leads.workflowId, workflows.id))
    .where(eq(leads.listId, listId))
    .orderBy(desc(leads.score), desc(leads.createdAt));

  const mapped = rows.map((r) => ({
    ...r,
    industry: INDUSTRY_LABEL[r.industry] ?? r.industry,
    channel: CHANNEL_LABEL[r.channel] ?? r.channel,
    status: STATUS_META[r.status]?.label ?? r.status,
    createdAt: new Date(r.createdAt).toLocaleString("ar-EG"),
  }));

  const csv = toCsv(COLUMNS, mapped);
  const safeName = list.name.replace(/[^\p{L}\p{N}\- _]/gu, "").slice(0, 60) || "list";
  return csvResponse(`${safeName}.csv`, csv);
}
