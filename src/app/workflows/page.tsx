"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Workflow as WorkflowIcon,
  Boxes,
  Clock3,
  Plug,
  Users,
  ArrowLeft,
} from "lucide-react";
import { formatMoney } from "@/lib/constants";
import type { ApiLead, ApiWorkflow } from "@/lib/types";
import { Skeleton, ScoreRing } from "@/components/ui";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<ApiWorkflow[] | null>(null);
  const [leads, setLeads] = useState<ApiLead[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/workflows").then((r) => r.json()),
      fetch("/api/leads").then((r) => r.json()),
    ])
      .then(([w, l]) => {
        setWorkflows(w.workflows ?? []);
        setLeads(l.leads ?? []);
      })
      .catch(() => setWorkflows([]));
  }, []);

  if (workflows === null) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">
          كتالوج الورك فلو
        </h1>
        <p className="mt-1.5 max-w-xl text-[13px] leading-6 text-white/45">
          منتجات الجاهزة للبيع — كل ورك فلو n8n مبني ومجرّب، مع عدد العملاء
          المتطابقين معاه من قاعدتك دلوقتي.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {workflows.map((wf, i) => {
          const matched = leads.filter(
            (l) =>
              l.workflowId === wf.id &&
              l.status !== "won" &&
              l.status !== "lost",
          );
          const potential = matched.reduce((s, l) => s + l.dealValue, 0);
          return (
            <article
              key={wf.id}
              style={{ animationDelay: `${i * 60}ms` }}
              className="card card-hover group relative flex flex-col overflow-hidden p-5 [animation:var(--animate-rise)]"
            >
              <div className="pointer-events-none absolute -left-12 -top-14 size-32 rounded-full bg-brand/10 blur-2xl transition-all duration-500 group-hover:bg-brand/20" />

              <div className="relative mb-3.5 flex items-start justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand/25 to-brand/5 text-brand-2">
                  <WorkflowIcon className="size-5" strokeWidth={2} />
                </span>
                <span className="rounded-full border border-line bg-white/[0.04] px-2.5 py-1 text-[10.5px] font-bold text-white/55">
                  {wf.category}
                </span>
              </div>

              <h2 className="relative text-[16px] font-bold">{wf.name}</h2>
              <p className="relative mt-2 flex-1 text-[12px] leading-6 text-white/50">
                {wf.description}
              </p>

              <div className="relative mt-4 flex flex-wrap gap-1.5">
                {wf.integrations.map((intg) => (
                  <span
                    key={intg}
                    className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold text-white/55"
                  >
                    <Plug className="size-2.5" />
                    {intg}
                  </span>
                ))}
              </div>

              <div className="relative mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
                <MiniStat icon={Boxes} value={`${wf.nodes}`} label="عقدة" />
                <MiniStat
                  icon={Clock3}
                  value={`${wf.hoursSaved} س`}
                  label="توفير/شهر"
                />
                <MiniStat
                  icon={Users}
                  value={`${matched.length}`}
                  label="عميل متطابق"
                />
              </div>

              <div className="relative mt-4 flex items-center justify-between rounded-xl border border-line bg-white/[0.03] px-4 py-3">
                <div>
                  <p className="text-[10px] font-semibold text-white/35">سعر البيع</p>
                  <p className="text-[17px] font-bold tabular text-lime-300">
                    {formatMoney(wf.price)}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-semibold text-white/35">
                    داخل خطك الآن
                  </p>
                  <p className="text-[13px] font-bold tabular text-white/75">
                    {formatMoney(potential)}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Best matches strip */}
      <MatchStrip workflows={workflows} leads={leads} />
    </div>
  );
}

function MiniStat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Boxes;
  value: string;
  label: string;
}) {
  return (
    <div>
      <p className="flex items-center justify-center gap-1 text-[12.5px] font-bold tabular text-white/80">
        <Icon className="size-3.5 text-white/30" />
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-white/35">{label}</p>
    </div>
  );
}

function MatchStrip({
  workflows,
  leads,
}: {
  workflows: ApiWorkflow[];
  leads: ApiLead[];
}) {
  const rows = workflows
    .map((wf) => {
      const open = leads
        .filter(
          (l) => l.workflowId === wf.id && l.status !== "won" && l.status !== "lost",
        )
        .sort((a, b) => b.score - a.score);
      return { wf, open };
    })
    .filter((r) => r.open.length > 0)
    .slice(0, 3);

  if (rows.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-bold">أعلى تطابقات جاهزة للعرض</h2>
        <Link
          href="/leads"
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-2/80 hover:text-brand-2"
        >
          افتح القاعدة
          <ArrowLeft className="size-3.5" />
        </Link>
      </div>
      <div className="space-y-2.5">
        {rows.map(({ wf, open }) => {
          const top = open[0];
          return (
            <div
              key={wf.id}
              className="flex items-center gap-4 rounded-2xl border border-line bg-panel/60 px-4 py-3.5"
            >
              <ScoreRing score={top.score} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold">
                  {top.businessName}
                  <span className="mx-2 text-white/20">←</span>
                  <span className="text-brand-2">{wf.name}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-white/35">
                  {open.length} عميل متطابق — أعلى تقييم {top.score}/100
                </p>
              </div>
              <p className="text-[13px] font-bold tabular text-lime-300">
                {formatMoney(wf.price)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
