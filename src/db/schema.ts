import {
  pgTable,
  pgEnum,
  serial,
  integer,
  text,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const leadStatusEnum = pgEnum("lead_status", [
  "new",
  "contacted",
  "replied",
  "meeting",
  "negotiating",
  "won",
  "lost",
]);

export const lists = pgTable("lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: varchar("city", { length: 64 }),
  industries: text("industries")
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const workflows = pgTable("workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  price: integer("price").notNull().default(0),
  nodes: integer("nodes").notNull().default(0),
  integrations: text("integrations")
    .array()
    .notNull()
    .default(sql`ARRAY[]::text[]`),
  hoursSaved: integer("hours_saved").notNull().default(10),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  contactName: text("contact_name").notNull(),
  contactRole: varchar("contact_role", { length: 64 }).notNull().default(""),
  industry: varchar("industry", { length: 48 }).notNull(),
  city: varchar("city", { length: 64 }).notNull().default(""),
  channel: varchar("channel", { length: 24 }).notNull().default("whatsapp"),
  size: varchar("size", { length: 16 }).notNull().default("small"),
  painPoint: text("pain_point").notNull().default(""),
  score: integer("score").notNull().default(50),
  status: leadStatusEnum("status").notNull().default("new"),
  dealValue: integer("deal_value").notNull().default(0),
  workflowId: integer("workflow_id").references(() => workflows.id, {
    onDelete: "set null",
  }),
  listId: integer("list_id").references(() => lists.id, {
    onDelete: "set null",
  }),
  phone: text("phone"),
  website: text("website"),
  address: text("address"),
  source: varchar("source", { length: 16 }).notNull().default("manual"),
  notes: text("notes"),
  lastContactAt: timestamp("last_contact_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Workflow = typeof workflows.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type List = typeof lists.$inferSelect;
export type NewList = typeof lists.$inferInsert;
