"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Radar,
  Users,
  Flame,
  TrendingUp,
  CircleDollarSign,
  ArrowLeft,
  MapPin,
  Clock3,
  Target,
  BadgeCheck,
  Workflow,
  Plus,
} from "lucide-react";
import clsx from "clsx";
import {
  STATUS_ORDER,
  STATUS_META,
  INDUSTRY_LABEL,
  INDUSTRIES,
  formatMoney,
  timeAgo,
  scoreTone,
} from "@/lib/constants";
import type { ApiLead, StatusStat } from "@/lib/types";
import { ScoreRing, StatusChip, Skeleton, EmptyState } from "@/components/ui";

function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<ApiLead[] | null>(null);

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((d) => setLeads(d.leads ?? []))
      .catch(() => setLeads([]));
  }, []);

  if (leads === null) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-44" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const active = leads.filter((l) => l.status !== "won" && l.status !== "lost");
  const won = leads.filter((l) => l.status === "won");
  const pipelineValue = active.reduce((s, l) => s + l.dealValue, 0);
  const wonValue = won.reduce((s, l) => s + l.dealValue, 0);
  const hot = [...active].sort((a, b) => b.score - a.score).slice(0, 5);
  const recent = [...leads]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 4);

  const stats: StatusStat[] = STATUS_ORDER.map((status) => {
    const rows = leads.filter((l) => l.status === status);
    return {
      status,
      count: rows.length,
      value: rows.reduce((s, l) => s + l.dealValue, 0),
    };
  });
  const maxStatusCount = Math.max(1, ...stats.map((s) => s.count));

  const byIndustry = INDUSTRIES.map((ind) => ({
    ...ind,
    count: leads.filter((l) => l.industry === ind.value).length,
  }))
    .filter((i) => i.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxInd = Math.max(1, ...byIndustry.map((i) => i.count));

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="card relative overflow-hidden px-6 py-8 sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute -left-24 -top-28 size-80 rounded-full bg-brand/15 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-28 -right-10 size-72 rounded-full bg-lime/10 blur-[90px]" />
        <div className="relative flex flex-wrap items-center justify-between gap-8">
          <div className="max-w-xl">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-[11px] font-semibold text-brand-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-brand opacity-75 [animation:var(--animate-ping-slow)]" />
                <span className="relative inline-flex size-2 rounded-full bg-brand" />
              </span>
              الرادار شغّال — الفرص محدّثة
            </p>
            <h1 className="text-[26px] font-bold leading-[1.35] tracking-tight sm:text-4xl sm:leading-[1.3]">
              اصطاد اللي <span className="text-gradient">محتاج أتمتة</span>…
              وخلّي الورك فلو يقفل الصفقة.
            </h1>
            <p className="mt-3.5 max-w-lg text-[13.5px] leading-7 text-white/50">
              قاعدة عملاء جاهزة لبيع أتمتة n8n: فرص مقيّمة بالذكاء، ورك فلو
              مقترح لكل عميل، وخط بيع كامل من أول رسالة لحد ما الفلوس توصل.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/scout"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-brand to-[#d61f4b] px-5 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_30px_-8px_rgb(255_77_109/0.7)] transition-transform hover:scale-[1.03] active:scale-95"
              >
                <Radar className="size-4 transition-transform duration-500 group-hover:rotate-180" />
                ابدأ الاستكشاف
              </Link>
              <Link
                href="/leads?new=1"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-white/[0.04] px-5 py-2.5 text-[13px] font-bold text-white/80 transition-colors hover:bg-white/[0.08]"
              >
                <Plus className="size-4" />
                أضف عميل يدوي
              </Link>
            </div>
          </div>

          <div className="hidden shrink-0 [animation:var(--animate-float)] md:block">
            <div className="relative size-44">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="absolute rounded-full border border-white/10"
                  style={{ inset: `${i * 20}px` }}
                />
              ))}
              <span className="absolute inset-0 rounded-full [background:conic-gradient(from_0deg,transparent_0deg,transparent_300deg,rgb(255_77_109/0.35)_350deg,#ff4d6d_360deg)] [animation:var(--animate-radar-sweep)]" />
              <span className="absolute inset-0 grid place-items-center">
                <Target className="size-8 text-brand-2" />
              </span>
              <span className="absolute right-6 top-8 size-2 rounded-full bg-lime shadow-[0_0_10px_#a3e635]" />
              <span className="absolute bottom-9 left-8 size-1.5 rounded-full bg-brand-2 shadow-[0_0_10px_#ff8fab]" />
            </div>
          </div>
        </div>
      </section>

      {/* KPI row */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          icon={Users}
          tint="text-sky-300"
          bg="bg-sky-400/10"
          value={leads.length}
          label="عميل في القاعدة"
          suffix=""
        />
        <Kpi
          icon={Flame}
          tint="text-orange-300"
          bg="bg-orange-400/10"
          value={active.length}
          label="فرصة نشطة دلوقتي"
          suffix=""
        />
        <Kpi
          icon={TrendingUp}
          tint="text-brand-2"
          bg="bg-brand/10"
          value={pipelineValue}
          label="قيمة خط البيع"
          money
        />
        <Kpi
          icon={CircleDollarSign}
          tint="text-lime-300"
          bg="bg-lime-400/10"
          value={wonValue}
          label="صفقات اتقفلت"
          money
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Hot opportunities */}
        <section className="card p-5 lg:col-span-3 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-brand/10 text-brand-2">
                <Flame className="size-4" />
              </span>
              <h2 className="text-[15px] font-bold">أهم الفرص الساخنة</h2>
            </div>
            <Link
              href="/leads"
              className="inline-flex items-center gap-1 text-[12px] font-semibold text-white/40 transition-colors hover:text-white"
            >
              كل العملاء
              <ArrowLeft className="size-3.5" />
            </Link>
          </div>

          {hot.length === 0 ? (
            <EmptyState
              title="لسه مفيش فرص"
              hint="شغّل رادار الاستكشاف وأول عملاء هيظهروا هنا فورًا."
            >
              <Link
                href="/scout"
                className="mt-2 rounded-xl bg-brand px-4 py-2 text-[12px] font-bold text-white"
              >
                افتح الرادار
              </Link>
            </EmptyState>
          ) : (
            <ul className="space-y-2.5">
              {hot.map((lead, i) => {
                const tone = scoreTone(lead.score);
                return (
                  <li
                    key={lead.id}
                    style={{ animationDelay: `${i * 70}ms` }}
                    className="group flex items-center gap-4 rounded-2xl border border-line bg-white/[0.02] px-4 py-3.5 transition-all duration-300 [animation:var(--animate-rise)] hover:border-white/15 hover:bg-white/[0.05]"
                  >
                    <ScoreRing score={lead.score} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <p className="truncate text-[13.5px] font-bold">
                          {lead.businessName}
                        </p>
                        <span
                          className={clsx(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold",
                            tone.text,
                            "bg-white/[0.05]",
                          )}
                        >
                          {tone.label}
                        </span>
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-white/40">
                        <span>{INDUSTRY_LABEL[lead.industry]}</span>
                        <span className="text-white/15">•</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" />
                          {lead.city}
                        </span>
                        {lead.workflowName && (
                          <>
                            <span className="text-white/15">•</span>
                            <span className="inline-flex items-center gap-1 text-brand-2/80">
                              <Workflow className="size-3" />
                              {lead.workflowName}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-bold tabular text-white/85">
                        {formatMoney(lead.dealValue)}
                      </p>
                      <p className="mt-0.5"><StatusChip status={lead.status} /></p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Pipeline pulse */}
        <section className="card p-5 lg:col-span-2 sm:p-6">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-lime-400/10 text-lime-300">
              <BadgeCheck className="size-4" />
            </span>
            <h2 className="text-[15px] font-bold">نبض خط البيع</h2>
          </div>
          <ul className="space-y-3">
            {stats.map((s) => {
              const meta = STATUS_META[s.status];
              return (
                <li key={s.status} className="group">
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-2 font-semibold text-white/70">
                      <span className={clsx("size-2 rounded-full", meta.dot)} />
                      {meta.label}
                    </span>
                    <span className="tabular text-white/40">
                      {s.count}{" "}
                      <span className="text-white/20">
                        / {formatMoney(s.value)}
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={clsx(
                        "h-full rounded-full transition-all duration-1000",
                        meta.bar,
                      )}
                      style={{
                        width: `${(s.count / maxStatusCount) * 100}%`,
                        opacity: s.count === 0 ? 0.15 : 0.9,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 border-t border-line pt-5">
            <h3 className="mb-3 text-[12px] font-bold text-white/50">
              التوزيع حسب المجال
            </h3>
            <ul className="space-y-2.5">
              {byIndustry.slice(0, 5).map((ind) => (
                <li key={ind.value} className="flex items-center gap-3 text-[11.5px]">
                  <span className="w-24 shrink-0 truncate text-white/50">
                    {ind.label}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-brand-2 to-brand transition-all duration-1000"
                      style={{ width: `${(ind.count / maxInd) * 100}%` }}
                    />
                  </div>
                  <span className="w-5 text-left font-bold tabular text-white/70">
                    {ind.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* Recent additions */}
      <section className="card p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[15px] font-bold">أحدث ما التقطه الرادار</h2>
          <Link
            href="/scout"
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-2/80 transition-colors hover:text-brand-2"
          >
            اصطاد المزيد
            <ArrowLeft className="size-3.5" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {recent.map((lead) => (
            <Link
              key={lead.id}
              href="/leads"
              className="card-hover rounded-2xl border border-line bg-white/[0.02] p-4"
            >
              <div className="mb-2.5 flex items-center justify-between">
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10.5px] font-semibold text-white/60">
                  {INDUSTRY_LABEL[lead.industry]}
                </span>
                <span className="flex items-center gap-1 text-[10.5px] text-white/30">
                  <Clock3 className="size-3" />
                  {timeAgo(lead.createdAt)}
                </span>
              </div>
              <p className="truncate text-[13px] font-bold">{lead.businessName}</p>
              <p className="mt-1 line-clamp-2 text-[11.5px] leading-5 text-white/40">
                {lead.painPoint}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Kpi({
  icon: Icon,
  tint,
  bg,
  value,
  label,
  money = false,
  suffix = "",
}: {
  icon: typeof Users;
  tint: string;
  bg: string;
  value: number;
  label: string;
  money?: boolean;
  suffix?: string;
}) {
  const animated = useCountUp(value);
  return (
    <div className="card card-hover relative overflow-hidden p-4 sm:p-5">
      <div
        className={clsx(
          "mb-3 grid size-9 place-items-center rounded-xl",
          bg,
          tint,
        )}
      >
        <Icon className="size-4.5" strokeWidth={2.1} />
      </div>
      <p className="text-xl font-bold tabular tracking-tight sm:text-2xl">
        {money ? formatMoney(animated) : animated.toLocaleString("en-US")}
        {suffix && <span className="text-sm font-semibold text-white/40"> {suffix}</span>}
      </p>
      <p className="mt-1 text-[11.5px] font-medium text-white/40">{label}</p>
    </div>
  );
}
