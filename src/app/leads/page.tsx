"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  X,
  MapPin,
  Workflow as WorkflowIcon,
  StickyNote,
  Trash2,
  Phone,
  Bot,
  MessageCircle,
  Globe,
} from "lucide-react";
import clsx from "clsx";
import {
  STATUS_ORDER,
  STATUS_META,
  INDUSTRIES,
  INDUSTRY_LABEL,
  CHANNELS,
  CHANNEL_LABEL,
  SIZES,
  CITIES,
  formatMoney,
  timeAgo,
  type LeadStatus,
} from "@/lib/constants";
import type { ApiLead, ApiWorkflow } from "@/lib/types";
import {
  ScoreRing,
  StatusChip,
  ChannelIcon,
  EmptyState,
  Field,
  TextInput,
  SelectInput,
  TextArea,
  Skeleton,
} from "@/components/ui";

export default function LeadsPage() {
  const [leads, setLeads] = useState<ApiLead[] | null>(null);
  const [workflows, setWorkflows] = useState<ApiWorkflow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [industry, setIndustry] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  async function reload() {
    try {
      const [a, b] = await Promise.all([
        fetch("/api/leads").then((r) => r.json()),
        fetch("/api/workflows").then((r) => r.json()),
      ]);
      setLeads(a.leads ?? []);
      setWorkflows(b.workflows ?? []);
    } catch {
      setLeads([]);
    }
  }

  useEffect(() => {
    reload();
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("new") === "1"
    ) {
      setAddOpen(true);
    }
  }, []);

  const filtered = useMemo(() => {
    if (!leads) return [];
    const needle = q.trim();
    return leads.filter((l) => {
      if (status !== "all" && l.status !== status) return false;
      if (industry !== "all" && l.industry !== industry) return false;
      if (
        needle &&
        ![l.businessName, l.contactName, l.city].some((f) =>
          f.includes(needle),
        )
      )
        return false;
      return true;
    });
  }, [leads, q, status, industry]);

  const selected = leads?.find((l) => l.id === selectedId) ?? null;

  function patchLocal(id: number, patch: Partial<ApiLead>) {
    setLeads((prev) =>
      prev ? prev.map((l) => (l.id === id ? { ...l, ...patch } : l)) : prev,
    );
  }

  async function updateLead(id: number, patch: Record<string, unknown>) {
    patchLocal(id, patch as Partial<ApiLead>);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.lead) patchLocal(id, data.lead);
    } catch {
      /* optimistic-only */
    }
  }

  async function deleteLead(id: number) {
    setLeads((prev) => (prev ? prev.filter((l) => l.id !== id) : prev));
    setSelectedId(null);
    await fetch(`/api/leads/${id}`, { method: "DELETE" }).catch(() => {});
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">
            قاعدة العملاء
          </h1>
          <p className="mt-1.5 text-[13px] text-white/45">
            {leads ? `${leads.length} عميل محتمل — ` : ""}كل فرصة جاية معاها
            اقتراح الورك فلو المناسب.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-brand to-[#d61f4b] px-4.5 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_28px_-8px_rgb(255_77_109/0.7)] transition-transform hover:scale-[1.03] active:scale-95"
        >
          <Plus className="size-4" />
          أضف عميل
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-5 flex flex-wrap items-center gap-3 p-3.5">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="دور بالاسم، النشاط، أو المدينة…"
            className="w-full rounded-xl border border-line bg-white/[0.04] py-2.5 pe-3.5 ps-10 text-[13px] placeholder:text-white/25 focus:border-brand/50"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-line bg-white/[0.04] px-3.5 py-2.5 text-[12.5px] text-white/80 focus:border-brand/50"
        >
          <option value="all">كل الحالات</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="rounded-xl border border-line bg-white/[0.04] px-3.5 py-2.5 text-[12.5px] text-white/80 focus:border-brand/50"
        >
          <option value="all">كل المجالات</option>
          {INDUSTRIES.map((i) => (
            <option key={i.value} value={i.value}>
              {i.label}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      {leads === null ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="مفيش نتائج مطابقة"
          hint="جرّب تغيّر الفلاتر، أو شغّل رادار الاستكشاف واصطاد عملاء جداد."
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((lead, i) => (
            <button
              key={lead.id}
              onClick={() => setSelectedId(lead.id)}
              style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}
              className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3.5 rounded-2xl border border-line bg-panel/60 px-4 py-3.5 text-start transition-all duration-300 [animation:var(--animate-rise)] hover:border-white/15 hover:bg-panel-2 sm:grid-cols-[auto_1.4fr_1fr_auto_auto_auto] sm:gap-5"
            >
              <ScoreRing score={lead.score} size={42} />

              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-bold">
                  {lead.businessName}
                </p>
                <p className="mt-0.5 truncate text-[11.5px] text-white/40">
                  {lead.contactName || lead.contactRole
                    ? [lead.contactName, lead.contactRole]
                        .filter(Boolean)
                        .join(" · ")
                    : "جهة اتصال مباشرة — اتصل بالنشاط"}
                </p>
              </div>

              <div className="hidden min-w-0 sm:block">
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10.5px] font-semibold text-white/60">
                  {INDUSTRY_LABEL[lead.industry]}
                </span>
                <p className="mt-1.5 flex items-center gap-1 text-[11px] text-white/35">
                  <MapPin className="size-3" />
                  {lead.city}
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

              <div className="text-left">
                <StatusChip status={lead.status} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <LeadDrawer
          lead={selected}
          workflows={workflows}
          onClose={() => setSelectedId(null)}
          onUpdate={updateLead}
          onDelete={deleteLead}
        />
      )}

      {/* Add dialog */}
      {addOpen && (
        <AddLeadDialog
          workflows={workflows}
          onClose={() => setAddOpen(false)}
          onCreated={(lead) => {
            setLeads((prev) => (prev ? [{ ...lead }, ...prev] : [lead]));
            setAddOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ================= Drawer ================= */

function LeadDrawer({
  lead,
  workflows,
  onClose,
  onUpdate,
  onDelete,
}: {
  lead: ApiLead;
  workflows: ApiWorkflow[];
  onClose: () => void;
  onUpdate: (id: number, patch: Record<string, unknown>) => void;
  onDelete: (id: number) => void;
}) {
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="إغلاق"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <aside className="absolute inset-y-0 end-0 flex w-full max-w-md flex-col overflow-y-auto border-s border-line bg-panel shadow-2xl [animation:drawer-in_.35s_cubic-bezier(.22,1,.36,1)_both]">
        <style>{`@keyframes drawer-in{from{transform:translateX(-40px);opacity:0}to{transform:none;opacity:1}}`}</style>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-panel/90 px-5 py-4 backdrop-blur">
          <StatusChip status={lead.status} />
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg border border-line text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 p-5">
          <div className="flex items-start gap-4">
            <ScoreRing score={lead.score} size={56} stroke={4} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold leading-snug">{lead.businessName}</h2>
                {lead.source === "osm" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-lime/25 bg-lime-400/10 px-2 py-0.5 text-[10px] font-bold text-lime-300">
                    <Globe className="size-2.5" />
                    عميل حقيقي
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12.5px] text-white/45">
                {lead.contactName || lead.contactRole
                  ? [lead.contactName, lead.contactRole].filter(Boolean).join(" · ")
                  : "تواصل مباشر مع النشاط"}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-white/35">
                <MapPin className="size-3.5" />
                {lead.address ? `${lead.address}، ` : ""}
                {lead.city} — {INDUSTRY_LABEL[lead.industry]}
              </p>
            </div>
          </div>

          {/* Real contact channels */}
          {(lead.phone || lead.website) && (
            <section>
              <h3 className="mb-2.5 text-[11.5px] font-bold text-white/45">
                تواصل الآن
              </h3>
              <div className="flex flex-wrap gap-2">
                {lead.phone && (
                  <>
                    <a
                      href={`tel:${lead.phone.replace(/[^+\d]/g, "")}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-lime/25 bg-lime-400/10 px-3.5 py-2 text-[12px] font-bold text-lime-300 transition-colors hover:bg-lime-400/20"
                    >
                      <Phone className="size-3.5" />
                      <span dir="ltr">{lead.phone}</span>
                    </a>
                    <a
                      href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-2 text-[12px] font-bold text-emerald-300 transition-colors hover:bg-emerald-400/20"
                    >
                      <MessageCircle className="size-3.5" />
                      واتساب
                    </a>
                  </>
                )}
                {lead.website && (
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/25 bg-sky-400/10 px-3.5 py-2 text-[12px] font-bold text-sky-300 transition-colors hover:bg-sky-400/20"
                  >
                    <Globe className="size-3.5" />
                    زيارة الموقع
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Status stepper */}
          <section>
            <h3 className="mb-2.5 text-[11.5px] font-bold text-white/45">
              حالة الفرصة
            </h3>
            <div className="grid grid-cols-4 gap-1.5">
              {STATUS_ORDER.map((s) => {
                const meta = STATUS_META[s];
                const active = lead.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => onUpdate(lead.id, { status: s as LeadStatus })}
                    className={clsx(
                      "rounded-lg border px-1 py-2 text-[10.5px] font-bold transition-all",
                      active
                        ? clsx(meta.chip, "border-transparent")
                        : "border-line bg-white/[0.02] text-white/35 hover:bg-white/[0.05] hover:text-white/60",
                    )}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Workflow match */}
          <section>
            <h3 className="mb-2.5 text-[11.5px] font-bold text-white/45">
              <span className="inline-flex items-center gap-1.5">
                <WorkflowIcon className="size-3.5 text-brand-2" />
                الورك فلو المقترح للبيع
              </span>
            </h3>
            <select
              value={lead.workflowId ?? ""}
              onChange={(e) =>
                onUpdate(lead.id, {
                  workflowId: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="w-full rounded-xl border border-brand/25 bg-brand/[0.07] px-3.5 py-2.5 text-[13px] font-semibold text-brand-2 focus:border-brand/60"
            >
              <option value="">بدون اقتراح</option>
              {workflows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — {formatMoney(w.price)}
                </option>
              ))}
            </select>
          </section>

          {/* Pain point */}
          <section>
            <h3 className="mb-2.5 text-[11.5px] font-bold text-white/45">
              <span className="inline-flex items-center gap-1.5">
                <Bot className="size-3.5 text-orange-300" />
                المشكلة اللي هنبيع عليها
              </span>
            </h3>
            <p className="rounded-xl border border-line bg-white/[0.03] p-3.5 text-[12.5px] leading-6 text-white/60">
              {lead.painPoint}
            </p>
          </section>

          {/* Meta grid */}
          <section className="grid grid-cols-3 gap-2.5">
            <MetaBox label="قيمة الصفقة" value={formatMoney(lead.dealValue)} strong />
            <MetaBox
              label="القناة"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <ChannelIcon channel={lead.channel} className="size-3.5" />
                  {CHANNEL_LABEL[lead.channel]}
                </span>
              }
            />
            <MetaBox label="آخر تواصل" value={timeAgo(lead.lastContactAt)} />
          </section>

          {/* Notes */}
          <section>
            <h3 className="mb-2.5 text-[11.5px] font-bold text-white/45">
              <span className="inline-flex items-center gap-1.5">
                <StickyNote className="size-3.5 text-sky-300" />
                ملاحظاتك
              </span>
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="مثال: رد عليّ وقال كلميني بعد الأسبوع الجاي…"
              className="w-full resize-none rounded-xl border border-line bg-white/[0.04] px-3.5 py-2.5 text-[12.5px] placeholder:text-white/25 focus:border-brand/50"
            />
            <button
              onClick={() => onUpdate(lead.id, { notes })}
              className="mt-2 rounded-lg border border-line bg-white/[0.05] px-3.5 py-2 text-[11.5px] font-bold text-white/70 transition-colors hover:bg-white/[0.09]"
            >
              حفظ الملاحظة
            </button>
          </section>
        </div>

        <div className="border-t border-line p-4">
          {confirmDel ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDelete(lead.id)}
                className="flex-1 rounded-xl bg-red-500/90 py-2.5 text-[12.5px] font-bold text-white"
              >
                متأكد — امسح
              </button>
              <button
                onClick={() => setConfirmDel(false)}
                className="flex-1 rounded-xl border border-line py-2.5 text-[12.5px] font-bold text-white/60"
              >
                تراجع
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDel(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.07] py-2.5 text-[12.5px] font-bold text-red-300 transition-colors hover:bg-red-500/[0.14]"
            >
              <Trash2 className="size-4" />
              امسح العميل
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

function MetaBox({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.03] p-3 text-center">
      <p className="mb-1 text-[10px] font-semibold text-white/35">{label}</p>
      <p
        className={clsx(
          "text-[12px]",
          strong ? "font-bold tabular text-lime-300" : "font-semibold text-white/75",
        )}
      >
        {value}
      </p>
    </div>
  );
}

/* ================= Add dialog ================= */

function AddLeadDialog({
  workflows,
  onClose,
  onCreated,
}: {
  workflows: ApiWorkflow[];
  onClose: () => void;
  onCreated: (lead: ApiLead) => void;
}) {
  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    contactRole: "",
    industry: "ecommerce",
    city: CITIES[0],
    channel: "whatsapp",
    size: "small",
    score: 70,
    dealValue: 350,
    painPoint: "",
    workflowId: "",
    phone: "",
    website: "",
  });
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.businessName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          workflowId: form.workflowId ? Number(form.workflowId) : null,
        }),
      });
      const data = await res.json();
      if (data.lead) {
        const wf = workflows.find((w) => w.id === data.lead.workflowId);
        onCreated({ ...data.lead, workflowName: wf?.name ?? null });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
      <button
        aria-label="إغلاق"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />
      <form
        onSubmit={submit}
        className="card relative z-10 w-full max-w-lg p-6 [animation:var(--animate-rise)]"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[16px] font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-brand/10 text-brand-2">
              <Phone className="size-4" />
            </span>
            عميل جديد يدويًا
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg border border-line text-white/50 hover:bg-white/[0.06]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <Field label="اسم النشاط *" className="col-span-2">
            <TextInput
              required
              value={form.businessName}
              onChange={(e) => set("businessName", e.target.value)}
              placeholder="مثال: متجر لمسة"
            />
          </Field>
          <Field label="جهة الاتصال">
            <TextInput
              value={form.contactName}
              onChange={(e) => set("contactName", e.target.value)}
              placeholder="أحمد الهاشمي"
            />
          </Field>
          <Field label="الدور">
            <TextInput
              value={form.contactRole}
              onChange={(e) => set("contactRole", e.target.value)}
              placeholder="صاحب النشاط"
            />
          </Field>
          <Field label="المجال">
            <SelectInput
              value={form.industry}
              onChange={(e) => set("industry", e.target.value)}
            >
              {INDUSTRIES.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="المدينة">
            <SelectInput
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            >
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="قناة التواصل">
            <SelectInput
              value={form.channel}
              onChange={(e) => set("channel", e.target.value)}
            >
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="حجم النشاط">
            <SelectInput
              value={form.size}
              onChange={(e) => set("size", e.target.value)}
            >
              {SIZES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="رقم التليفون / واتساب">
            <TextInput
              dir="ltr"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+971 50 000 0000"
            />
          </Field>
          <Field label="الموقع الإلكتروني">
            <TextInput
              dir="ltr"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://example.com"
            />
          </Field>
          <Field label={`تقييم الفرصة: ${form.score}`}>
            <input
              type="range"
              min={10}
              max={100}
              value={form.score}
              onChange={(e) => set("score", Number(e.target.value))}
              className="w-full accent-[#ff4d6d]"
            />
          </Field>
          <Field label="قيمة الصفقة المتوقعة ($)">
            <TextInput
              type="number"
              min={0}
              value={form.dealValue}
              onChange={(e) => set("dealValue", Number(e.target.value))}
            />
          </Field>
          <Field label="الورك فلو المقترح" className="col-span-2">
            <SelectInput
              value={form.workflowId}
              onChange={(e) => set("workflowId", e.target.value)}
            >
              <option value="">بدون اقتراح</option>
              {workflows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — {formatMoney(w.price)}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="المشكلة / الألم" className="col-span-2">
            <TextArea
              value={form.painPoint}
              onChange={(e) => set("painPoint", e.target.value)}
              placeholder="وصف سريع للمشكلة اللي الورك فلو هيحلّها…"
            />
          </Field>
        </div>

        <button
          disabled={busy}
          className="mt-5 w-full rounded-xl bg-gradient-to-l from-brand to-[#d61f4b] py-3 text-[13.5px] font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          {busy ? "بيتحفظ…" : "احفظ العميل"}
        </button>
      </form>
    </div>
  );
}
