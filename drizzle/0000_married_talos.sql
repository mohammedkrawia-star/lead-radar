CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'replied', 'meeting', 'negotiating', 'won', 'lost');--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"business_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_role" varchar(64) DEFAULT '' NOT NULL,
	"industry" varchar(48) NOT NULL,
	"city" varchar(64) DEFAULT '' NOT NULL,
	"channel" varchar(24) DEFAULT 'whatsapp' NOT NULL,
	"size" varchar(16) DEFAULT 'small' NOT NULL,
	"pain_point" text DEFAULT '' NOT NULL,
	"score" integer DEFAULT 50 NOT NULL,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"deal_value" integer DEFAULT 0 NOT NULL,
	"workflow_id" integer,
	"list_id" integer,
	"phone" text,
	"whatsapp" text,
	"instagram" text,
	"website" text,
	"address" text,
	"source" varchar(16) DEFAULT 'manual' NOT NULL,
	"notes" text,
	"last_contact_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"city" varchar(64),
	"industries" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" varchar(64) NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"nodes" integer DEFAULT 0 NOT NULL,
	"integrations" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"hours_saved" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE set null ON UPDATE no action;