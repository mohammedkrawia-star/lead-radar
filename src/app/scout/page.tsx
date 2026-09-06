"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Radar,
  MapPin,
  Workflow,
  Flame,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  CircleDollarSign,
  Phone,
  Globe,
  Camera,
  TriangleAlert,
  ListChecks,
} from "lucide-react";
import clsx from "clsx";
import {
  INDUSTRIES,
  INDUSTRY_LABEL,
  CITIES,
  formatMoney,
  CHANNEL_LABEL,
} from "@/lib/constants";
import type { ApiLead } from "@/lib/types";
import { ScoreRing, ChannelIcon } from "@/components/ui";

const SCAN_PHRASES = [
  "بنجيوكود المدينة وبنحدد نطاق البحث…",
  "بنفتش قاعدة OpenStreetMap عن أنشطة حقيقية…",
  "بنستخرج بيانات التواصل: تليفونات ومواقع وعناوين…",
  "بنقيّم كل فرصة وبنطابقها مع أنسب ورك فلو…",
];

export default function ScoutPage() {
  const [industry, setIndustry] = useState("any");
  const [city, setCity] = useState("any");
  const [listName, setListName] = useState("");
  const [scanning, setScanning] = useState(false);
  const [phrase, setPhrase] = useState(0);
  const [results, setResults] = useState<ApiLead[] | null>(null);
  const [cityUsed, setCityUsed] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedList, setSavedList] = useState<{ id: number; name: string } | null>(
    null,
  );
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (scanning) {
      timer.current = setInterval(
        () => setPhrase((p) => (p + 1) % SCAN_PHRASES.length),
        1600,
      );
    } else if (timer.current) {
      clearInterval(timer.current);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [scanning]);

  async function runScout() {
    setScanning(true);
    setResults(null);
    setSavedList(null);
    setErrorMsg(null);
    const started = Date.now();
    try {
      const res = await fetch("/api/scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industry, city, listName: listName.trim() }),
      });
      const data = await res.json();
      const minWait = 3000 - (Date.now() - started);
      if (minWait > 0) await new Promise((r) => setTimeout(r, minWait));
      if (!res.ok || data.error) {
        setResults(null);
        setErrorMsg(
          data.message ?? "حصل خطأ غير متوقع. جرب تاني بعد شوية.",
        );
        return;
      }
      setResults(data.leads ?? []);
      setCityUsed(data.cityUsed ?? "");
      setSavedList(data.list ?? null);
    } catch {
      setErrorMsg("مقدرناش نوصل للسيرفر. اتأكد من الاتصال وجرب تاني.");
    } finally {
      setScanning(false);
    }
  }

  const totalValue = (results ?? []).reduce((s, l) => s + l.dealValue, 0);

  return (
    <div>
      <div className="mb-8 text-center">
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-lime/25 bg-lime-400/10 px-3 py-1 text-[11px] font-semibold text-lime-300">
          <Sparkles className="size-3" />
          بيانات حقيقية — OpenStreetMap
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          رادار الاستكشاف
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-white/45">
          حدّد المجال والمدينة — الرادار بيدور على أنشطة تجارية حقيقية
          بأرقامها وعناوينها، وبيحسبلك أنسب ورك فلو تبيعه لكل واحد.
        </p>
      </div>

      {/* Radar visual */}
      <div className="relative mx-auto mb-9 flex max-w-md justify-center">
        <div className="relative size-60 sm:size-72">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={clsx(
                "absolute rounded-full border transition-colors duration-700",
                scanning ? "border-brand/25" : "border-white/10",
              )}
              style={{ inset: `${i * 26}px` }}
            />
          ))}
          <span className="absolute inset-x-0 top-1/2 h-px bg-white/[0.06]" />
          <span className="absolute inset-y-0 left-1/2 w-px bg-white/[0.06]" />
          <span
            className={clsx(
              "absolute inset-0 rounded-full",
              scanning
                ? "[background:conic-gradient(from_0deg,transparent_0deg,transparent_290deg,rgb(255_77_109/0.45)_345deg,#ff4d6d_360deg)] [animation:var(--animate-radar-sweep)]"
                : "[background:conic-gradient(from_0deg,transparent_0deg,transparent_310deg,rgb(255_255_255/0.14)_352deg,rgb(255_255_255/0.5)_360deg)] [animation:var(--animate-radar-sweep)] [animation-duration:6s]",
            )}
          />
          <span
            className={clsx(
              "absolute inset-0 grid place-items-center transition-colors duration-700",
              scanning ? "text-brand-2" : "text-white/30",
            )}
          >
            <Radar className={clsx("size-9", scanning && "animate-pulse")} />
          </span>
          {scanning && (
            <>
              <span className="absolute right-[22%] top-[30%] size-2 rounded-full bg-lime shadow-[0_0_12px_#a3e635] animate-ping" />
              <span className="absolute bottom-[26%] left-[26%] size-1.5 rounded-full bg-brand-2 shadow-[0_0_12px_#ff8fab] animate-ping [animation-delay:0.6s]" />
              <span className="absolute right-[34%] bottom-[18%] size-1.5 rounded-full bg-sky-300 shadow-[0_0_12px_#7dd3fc] animate-ping [animation-delay:1.1s]" />
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="card mx-auto max-w-2xl p-5 sm:p-6">
        <p className="mb-2.5 text-[12px] font-bold text-white/50">المجال</p>
        <div className="mb-5 flex flex-wrap gap-2">
          <Chip active={industry === "any"} onClick={() => setIndustry("any")}>
            أي مجال
          </Chip>
          {INDUSTRIES.map((ind) => (
            <Chip
              key={ind.value}
              active={industry === ind.value}
              onClick={() => setIndustry(ind.value)}
            >
              {ind.label}
            </Chip>
          ))}
        </div>

        <p className="mb-2.5 text-[12px] font-bold text-white/50">المدينة</p>
        <div className="mb-6 flex flex-wrap gap-2">
          <Chip active={city === "any"} onClick={() => setCity("any")}>
            مدينة عشوائية
          </Chip>
          {CITIES.map((c) => (
            <Chip key={c} active={city === c} onClick={() => setCity(c)}>
              {c}
            </Chip>
          ))}
        </div>

        <p className="mb-2.5 text-[12px] font-bold text-white/50">
          اسم القائمة (اختياري)
        </p>
        <input
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          placeholder="لو سبتها فاضية هنسمّي القائمة تلقائي بالمدينة والمجال والتاريخ"
          className="mb-6 w-full rounded-xl border border-line bg-white/[0.04] px-3.5 py-2.5 text-[13px] placeholder:text-white/25 focus:border-brand/50"
        />

        <button
          onClick={runScout}
          disabled={scanning}
          className={clsx(
            "group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl py-3.5 text-[14px] font-bold text-white transition-all",
            scanning
              ? "cursor-wait bg-white/[0.06]"
              : "bg-gradient-to-l from-brand to-[#d61f4b] shadow-[0_14px_36px_-10px_rgb(255_77_109/0.7)] hover:scale-[1.015] active:scale-[0.98]",
          )}
        >
          {scanning ? (
            <>
              <span className="absolute inset-y-0 w-16 bg-gradient-to-l from-transparent via-white/10 to-transparent [animation:var(--animate-scan-bar)]" />
              <Radar className="size-4.5 animate-spin [animation-duration:2.5s]" />
              <span className="text-[13px]">{SCAN_PHRASES[phrase]}</span>
            </>
          ) : (
            <>
              <Radar className="size-4.5 transition-transform duration-500 group-hover:rotate-180" />
              شغّل الرادار — اصطاد عملاء حقيقيين
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="mx-auto mt-10 flex max-w-2xl items-start gap-2.5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] p-4 [animation:var(--animate-rise)]">
          <TriangleAlert className="mt-0.5 size-4.5 shrink-0 text-amber-300" />
          <p className="text-[12.5px] leading-6 text-amber-200/80">{errorMsg}</p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="mx-auto mt-10 max-w-3xl [animation:var(--animate-rise)]">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-5 text-lime" />
              <h2 className="text-[14.5px] font-bold">
                {results.length} أنشطة حقيقية في{" "}
                <span className="text-lime-300">{cityUsed}</span> — اتضافت
                لقاعدتك
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-lime/25 bg-lime-400/10 px-3 py-1 text-[12px] font-bold text-lime-300 tabular">
              <CircleDollarSign className="size-3.5" />
              {formatMoney(totalValue)} قيمة متوقعة
            </span>
          </div>
          {savedList && (
            <p className="mb-5 flex items-center gap-2 text-[12.5px] text-white/45">
              <ListChecks className="size-3.5 text-brand-2" />
              اتحفظت في قائمة{" "}
              <Link
                href={`/lists/${savedList.id}`}
                className="font-bold text-brand-2 underline underline-offset-2"
              >
                {savedList.name}
              </Link>
            </p>
          )}
          <div className="grid gap-3.5 sm:grid-cols-2">
            {results.map((lead, i) => (
              <article
                key={lead.id}
                style={{ animationDelay: `${i * 120}ms` }}
                className="card card-hover relative overflow-hidden p-5 [animation:var(--animate-rise)]"
              >
                <div className="absolute -left-10 -top-12 size-28 rounded-full bg-brand/10 blur-2xl" />
                <div className="relative">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-white/40">
                          <Flame className="size-3.5 text-orange-300" />
                          فرصة جديدة
                        </span>
                        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-white/50">
                          {INDUSTRY_LABEL[lead.industry] ?? lead.industry}
                        </span>
                      </div>
                      <h3 className="text-[15px] font-bold leading-snug">
                        {lead.businessName}
                      </h3>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-white/40">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" />
                          {lead.address ? (
                            <span className="max-w-56 truncate">
                              {lead.address}، {lead.city}
                            </span>
                          ) : (
                            lead.city
                          )}
                        </span>
                        <span className="text-white/15">•</span>
                        <span className="inline-flex items-center gap-1">
                          <ChannelIcon channel={lead.channel} className="size-3" />
                          {CHANNEL_LABEL[lead.channel]}
                        </span>
                      </p>
                    </div>
                    <ScoreRing score={lead.score} size={50} />
                  </div>

                  {/* contact actions for real leads — only shown for a
                      channel we actually have real data for */}
                  {(lead.phone || lead.instagram || lead.website) && (
                    <div className="mb-3.5 flex flex-wrap gap-2">
                      {lead.phone && (
                        <a
                          href={`tel:${lead.phone.replace(/[^+\d]/g, "")}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-lime/25 bg-lime-400/10 px-3 py-1.5 text-[11px] font-bold text-lime-300 transition-colors hover:bg-lime-400/20"
                        >
                          <Phone className="size-3" />
                          <span dir="ltr">{lead.phone}</span>
                        </a>
                      )}
                      {lead.instagram && (
                        <a
                          href={lead.instagram}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/25 bg-fuchsia-400/10 px-3 py-1.5 text-[11px] font-bold text-fuchsia-300 transition-colors hover:bg-fuchsia-400/20"
                        >
                          <Camera className="size-3" />
                          انستجرام
                        </a>
                      )}
                      {lead.website && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1.5 text-[11px] font-bold text-sky-300 transition-colors hover:bg-sky-400/20"
                        >
                          <Globe className="size-3" />
                          الموقع
                        </a>
                      )}
                    </div>
                  )}

                  <p className="mb-3.5 rounded-xl border border-line bg-white/[0.03] p-3 text-[11.5px] leading-5.5 text-white/55">
                    <span className="me-1 font-bold text-white/35">
                      مشكلة متوقعة:
                    </span>
                    {lead.painPoint}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    {lead.workflowName ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/10 px-3 py-1.5 text-[11px] font-bold text-brand-2">
                        <Workflow className="size-3.5" />
                        {lead.workflowName}
                        {lead.workflowPrice && (
                          <span className="tabular text-brand-2/60">
                            {formatMoney(lead.workflowPrice)}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="text-[12px] font-bold tabular text-white/60">
                      {formatMoney(lead.dealValue)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/pipeline"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-brand to-[#d61f4b] px-5 py-2.5 text-[13px] font-bold text-white transition-transform hover:scale-[1.03]"
            >
              افتح خط البيع
              <ArrowLeft className="size-4" />
            </Link>
            <Link
              href="/leads"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-white/[0.04] px-5 py-2.5 text-[13px] font-bold text-white/80 hover:bg-white/[0.08]"
            >
              راجع القاعدة كاملة
            </Link>
            {savedList && (
              <Link
                href={`/lists/${savedList.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-white/[0.04] px-5 py-2.5 text-[13px] font-bold text-white/80 hover:bg-white/[0.08]"
              >
                <ListChecks className="size-4" />
                شوف القائمة
              </Link>
            )}
          </div>

          <p className="mt-6 text-center text-[10.5px] leading-5 text-white/25">
            بيانات الأنشطة من OpenStreetMap © المساهمون (ODbL). بعض الأنشطة قد
            لا يكون لها بيانات تواصل منشورة — دي ديانتك تكمّلها.
          </p>
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-all duration-200",
        active
          ? "border-brand/50 bg-brand/15 text-brand-2 shadow-[0_0_16px_-4px_rgb(255_77_109/0.5)]"
          : "border-line bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/80",
      )}
    >
      {children}
    </button>
  );
}
