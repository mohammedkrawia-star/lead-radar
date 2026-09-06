"use client";

import { useEffect, useState } from "react";
import {
  GripVertical,
  Workflow as WorkflowIcon,
  MapPin,
  TrendingUp,
} from "lucide-react";
import clsx from "clsx";
import {
  STATUS_ORDER,
  STATUS_META,
  INDUSTRY_LABEL,
  formatMoney,
  type LeadStatus,
} from "@/lib/constants";
import type { ApiLead } from "@/lib/types";
import { ChannelIcon, EmptyState, Skeleton } from "@/components/ui";
import { scoreTone } from "@/lib/constants";

export default function PipelinePage() {
  const [leads, setLeads] = useState<ApiLead[] | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<LeadStatus | null>(null);

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((d) => setLeads(d.leads ?? []))
      .catch(() => setLeads([]));
  }, []);

  async function moveTo(status: LeadStatus) {
    if (dragId === null) return;
    const id = dragId;
    setDragId(null);
    setOverCol(null);
    setLeads((prev) =>
      prev ? prev.map((l) => (l.id === id ? { ...l, status } : l)) : prev,
    );
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
  }

  if (leads === null) {
    return (
      <div className="flex gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-96 w-72 shrink-0" />
        ))}
      </div>
    );
  }

  const totalActive = leads
    .filter((l) => l.status !== "won" && l.status !== "lost")
    .reduce((s, l) => s + l.dealValue, 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">
            خط البيع
          </h1>
          <p className="mt-1.5 text-[13px] text-white/45">
            اسحب الكروت بين المراحل — كل تحديث بيتحفظ فورًا.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-4 py-2 text-[12.5px] font-bold text-white/75">
          <TrendingUp className="size-4 text-lime-300" />
          نشط الآن:
          <span className="tabular text-lime-300">{formatMoney(totalActive)}</span>
        </span>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-3.5 overflow-x-auto px-4 pb-4 lg:-mx-10 lg:px-10">
        {STATUS_ORDER.map((status) => {
          const meta = STATUS_META[status];
          const cards = leads
            .filter((l) => l.status === status)
            .sort((a, b) => b.score - a.score);
          const sum = cards.reduce((s, l) => s + l.dealValue, 0);
          const isOver = overCol === status;

          return (
            <section
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(status);
              }}
              onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                moveTo(status);
              }}
              className={clsx(
                "flex w-[270px] shrink-0 flex-col rounded-2xl border transition-colors duration-200 sm:w-[290px]",
                isOver
                  ? "border-brand/40 bg-brand/[0.06]"
                  : "border-line bg-panel/50",
              )}
            >
              <header className="flex items-center justify-between border-b border-line px-4 py-3.5">
                <span className="flex items-center gap-2 text-[12.5px] font-bold">
                  <span className={clsx("size-2 rounded-full", meta.dot)} />
                  {meta.label}
                  <span className="rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[10px] tabular text-white/50">
                    {cards.length}
                  </span>
                </span>
                <span className="text-[11px] font-semibold tabular text-white/35">
                  {formatMoney(sum)}
                </span>
              </header>

              <div className="flex min-h-40 flex-1 flex-col gap-2.5 p-3">
                {cards.length === 0 && (
                  <p className="grid flex-1 place-items-center rounded-xl border border-dashed border-line py-8 text-[11px] text-white/25">
                    اسحب كرت هنا
                  </p>
                )}
                {cards.map((lead) => {
                  const tone = scoreTone(lead.score);
                  return (
                    <article
                      key={lead.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", String(lead.id));
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(lead.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverCol(null);
                      }}
                      className={clsx(
                        "group cursor-grab rounded-xl border border-line bg-panel-2 p-3.5 transition-all duration-200 active:cursor-grabbing",
                        dragId === lead.id
                          ? "rotate-2 scale-[0.97] opacity-40"
                          : "hover:border-white/15 hover:bg-white/[0.04]",
                      )}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <p className="text-[12.5px] font-bold leading-snug">
                          {lead.businessName}
                        </p>
                        <span className="flex items-center gap-0.5 text-white/20">
                          <GripVertical className="size-3.5" />
                          <span
                            className={clsx(
                              "rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold tabular",
                              tone.text,
                            )}
                          >
                            {lead.score}
                          </span>
                        </span>
                      </div>
                      <p className="mb-2.5 flex items-center gap-1.5 text-[10.5px] text-white/35">
                        <span>{INDUSTRY_LABEL[lead.industry]}</span>
                        <span className="text-white/15">•</span>
                        <MapPin className="size-2.5" />
                        {lead.city}
                        <span className="text-white/15">•</span>
                        <ChannelIcon channel={lead.channel} className="size-3" />
                      </p>
                      <div className="flex items-center justify-between">
                        {lead.workflowName ? (
                          <span className="inline-flex max-w-[70%] items-center gap-1 truncate text-[10.5px] font-semibold text-brand-2/75">
                            <WorkflowIcon className="size-3 shrink-0" />
                            <span className="truncate">{lead.workflowName}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-white/20">—</span>
                        )}
                        <span className="text-[11.5px] font-bold tabular text-white/70">
                          {formatMoney(lead.dealValue)}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {leads.length === 0 && (
        <div className="mt-4">
          <EmptyState
            title="الخط فاضي"
            hint="شغّل رادار الاستكشاف وابدأ يدخل عملاء على المراحل."
          />
        </div>
      )}
    </div>
  );
}
