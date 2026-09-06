import "dotenv/config";
import { db } from "./index";
import { leads, workflows } from "./schema";
import { WORKFLOW_SEED, generateProspect } from "@/lib/scout-data";
import { CITIES } from "@/lib/constants";

async function main() {
  const existing = await db.select({ id: leads.id }).from(leads).limit(1);
  if (existing.length > 0) {
    console.log("Database already seeded — skipping.");
    return;
  }

  console.log("Seeding workflows…");
  const wfRows = await db
    .insert(workflows)
    .values(WORKFLOW_SEED.map((w) => ({ ...w, integrations: [...w.integrations] })))
    .returning();
  const byName = new Map(wfRows.map((w) => [w.name, w.id]));

  console.log("Seeding leads…");
  const industries = [
    "ecommerce",
    "ecommerce",
    "ecommerce",
    "clinic",
    "clinic",
    "clinic",
    "realestate",
    "realestate",
    "realestate",
    "restaurant",
    "restaurant",
    "restaurant",
    "agency",
    "agency",
    "agency",
    "education",
    "education",
    "education",
    "logistics",
    "logistics",
    "beauty",
    "beauty",
  ];
  const statuses = [
    "new",
    "new",
    "new",
    "new",
    "new",
    "new",
    "contacted",
    "contacted",
    "contacted",
    "contacted",
    "replied",
    "replied",
    "replied",
    "replied",
    "meeting",
    "meeting",
    "meeting",
    "negotiating",
    "negotiating",
    "negotiating",
    "won",
    "won",
    "lost",
  ] as const;

  const values = industries.map((industry, i) => {
    const p = generateProspect(industry, CITIES);
    const createdAt = new Date(Date.now() - (i * 19 + 6) * 3600 * 1000);
    const status = statuses[i % statuses.length];
    const workflowId = byName.get(p.matchedWorkflow) ?? null;
    const dealValue = p.setupFee + 60 * Math.round(3 + (i % 5));
    return {
      businessName: p.businessName,
      contactName: p.contactName,
      contactRole: p.contactRole,
      industry: p.industry,
      city: p.city,
      channel: p.channel,
      size: p.size,
      painPoint: p.painPoint,
      score: p.score,
      status,
      dealValue,
      workflowId,
      notes: status === "won" ? "اتقفلت! العقد اتوقّع والدفعة الأولى وصلت." : null,
      lastContactAt:
        status === "new"
          ? null
          : new Date(Date.now() - ((i % 4) + 1) * 24 * 3600 * 1000),
      createdAt,
    };
  });

  await db.insert(leads).values(values);
  console.log(`Seeded ${values.length} leads + ${wfRows.length} workflows.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
