import { db } from "@/db";
import { workflows } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(workflows).orderBy(asc(workflows.id));
  return Response.json({ workflows: rows });
}
