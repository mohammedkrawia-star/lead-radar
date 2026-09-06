"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Download,
  MapPin,
  Workflow as WorkflowIcon,
  X,
  Phone,
  Globe,
} from "lucide-react";
import {
  INDUSTRY_LABEL,
  CHANNEL_LABEL,
  formatMoney,
  timeAgo,
} from "@/lib/constants";
import type { ApiLead } from "@/lib/types";
import type { List } from "@/db/schema";
import { ScoreRing, StatusChip, ChannelIcon, EmptyState, Skeleton } from "@/components/ui";

export default function ListDetailPage() {
  const params = useParams<{ id: string }>();
  const listId = params.id;
  const [list, setList] = useState<List | null>(null);
  const [leads, setLeads] = useState<ApiLead[] | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/lists/${listId}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found");
        return r.json();
      })
      .then((data) => {
        setList(data.list);
        setLeads(data.leads ?? []);
      })
      .catch(() => setNotFound(true));
  }, [listId]);

  async function removeFromList(id: number) {
    setLeads((prev) => (prev ? prev.filter((l) => l.id !== id) : prev));
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listId: null }),
    }).catch(() => {});
  }

  if (notFound) {
    return (
      <EmptyState title="القائمة دي مش موجودة" hint="ممكن اتمسحت.">
        <Link
          href="/lists"
          className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand-2"
        >
          <ArrowRight className="size-3.5" />
          رجوع للقوائم
        </Link>
      </EmptyState>
    );
  }

  const totalValue = (leads ?? []).reduce((s, l) => s + l.dealValue, 0);

  return (
    <div>
      <Link
        href="/lists"
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-white/45 hover:text-white/70"
      >
        <ArrowRight className="size-3.5" />
        كل القوائم
      </Link>

      {!list ? (
        <Skeleton className="mb-6 h-24" />
      ) : (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">
              {list.name}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-white/45">
              {list.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {list.city}
                </span>
              )}
              <span>{leads ? `${leads.length} عميل` : ""}</span>
              <span>{formatMoney(totalValue)} قيمة إجمالية</span>
              <span>اتعملت {timeAgo(list.createdAt)}</span>
            </p>
          </div>
          <a
            href={`/api/lists/${list.id}/export`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-brand to-[#d61f4b] px-4.5 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_28px_-8px_rgb(255_77_109/0.7)] transition-transform hover:scale-[1.03]"
          >
            <Download className="size-4" />
            تصدير Excel
          </a>
        </div>
      )}

      {leads === null ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          title="القائمة دي لسه فاضية"
          hint="ارجع لرادار الاستكشاف وشغّل بحث بنفس اسم القائمة عشان تضيف نتائج ليها."
        />
      ) : (
        <div className="space-y-2.5">
          {leads.map((lead, i) => (
            <div
              key={lead.id}
              style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}
              className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3.5 rounded-2xl border border-line bg-panel/60 px-4 py-3.5 [animation:var(--animate-rise)] sm:grid-cols-[auto_1.4fr_1fr_auto_auto_auto]"
            >
              <ScoreRing score={lead.score} size={42} />

              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-bold">
                  {lead.businessName}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 truncate text-[11.5px] text-white/40">
                  <MapPin className="size-3" />
                  {lead.city}
                  {(lead.phone || lead.website) && (
                    <>
                      <span className="text-white/15">•</span>
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone.replace(/[^+\d]/g, "")}`}
                          className="inline-flex items-center gap-1 text-lime-300"
                        >
                          <Phone className="size-3" />
                          <span dir="ltr">{lead.phone}</span>
                        </a>
                      )}
                      {lead.website && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sky-300"
                        >
                          <Globe className="size-3" />
                          الموقع
                        </a>
                      )}
                    </>
                  )}
                </p>
              </div>

              <div className="hidden min-w-0 sm:block">
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10.5px] font-semibold text-white/60">
                  {INDUSTRY_LABEL[lead.industry]}
                </span>
                <p className="mt-1.5 flex items-center gap-1 text-[11px] text-white/35">
                  <ChannelIcon channel={lead.channel} className="size-3" />
                  {CHANNEL_LABEL[lead.channel]}
                </p>
              </div>

              <div className="hidden sm:block">
                {lead.workflowName ? (
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-brand-2/85">
                    <WorkflowIcon className="size-3.5" />
                    {lead.workflowName}
                  </span>
                ) : (
                  <span className="text-[11px] text-white/25">بدون اقتراح</span>
                )}
              </div>

              <div className="hidden text-left sm:block">
                <p className="text-[13px] font-bold tabular text-white/85">
                  {formatMoney(lead.dealValue)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <StatusChip status={lead.status} />
                <button
                  onClick={() => removeFromList(lead.id)}
                  title="شيل من القائمة"
                  className="grid size-7 shrink-0 place-items-center rounded-lg border border-line text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
