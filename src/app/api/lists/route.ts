import { db } from "@/db";
import { leads, lists } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select({
      id: lists.id,
      name: lists.name,
      city: lists.city,
      industries: lists.industries,
      createdAt: lists.createdAt,
      count: sql<number>`count(${leads.id})::int`,
      value: sql<number>`coalesce(sum(${leads.dealValue}),0)::int`,
    })
    .from(lists)
    .leftJoin(leads, eq(leads.listId, lists.id))
    .groupBy(lists.id)
    .orderBy(desc(lists.createdAt));

  return Response.json({ lists: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return Response.json({ error: "اسم القائمة مطلوب" }, { status: 400 });
  }

  const [row] = await db
    .insert(lists)
    .values({
      name,
      city: body?.city ? String(body.city) : null,
      industries: Array.isArray(body?.industries)
        ? body.industries.map(String)
        : [],
    })
    .returning();

  return Response.json(
    { list: { ...row, count: 0, value: 0 } },
    { status: 201 },
  );
}
