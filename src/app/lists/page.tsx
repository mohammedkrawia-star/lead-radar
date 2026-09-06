"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ListChecks,
  Plus,
  MapPin,
  Users,
  CircleDollarSign,
  Download,
  Trash2,
  X,
} from "lucide-react";
import { INDUSTRY_LABEL, formatMoney, timeAgo } from "@/lib/constants";
import type { ApiList } from "@/lib/types";
import { EmptyState, Skeleton, Field, TextInput } from "@/components/ui";

export default function ListsPage() {
  const [lists, setLists] = useState<ApiList[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function reload() {
    try {
      const res = await fetch("/api/lists");
      const data = await res.json();
      setLists(data.lists ?? []);
    } catch {
      setLists([]);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function deleteList(id: number) {
    setBusyId(id);
    try {
      await fetch(`/api/lists/${id}`, { method: "DELETE" });
      setLists((prev) => (prev ? prev.filter((l) => l.id !== id) : prev));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">
            القوائم
          </h1>
          <p className="mt-1.5 text-[13px] text-white/45">
            كل مرة تشغّل الرادار، النتائج بتتجمّع في قائمة — راجعها هنا أو
            صدّرها إكسل.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-brand to-[#d61f4b] px-4.5 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_28px_-8px_rgb(255_77_109/0.7)] transition-transform hover:scale-[1.03] active:scale-95"
        >
          <Plus className="size-4" />
          قائمة جديدة
        </button>
      </div>

      {lists === null ? (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : lists.length === 0 ? (
        <EmptyState
          title="مفيش قوائم لسه"
          hint="شغّل رادار الاستكشاف وهتلاقي نتائجه اتجمّعت في قائمة تلقائي، أو اعمل قائمة فاضية دلوقتي."
        />
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list, i) => (
            <div
              key={list.id}
              style={{ animationDelay: `${Math.min(i, 10) * 60}ms` }}
              className="card card-hover relative flex flex-col gap-3.5 p-5 [animation:var(--animate-rise)]"
            >
              <Link href={`/lists/${list.id}`} className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-lg bg-brand/10 text-brand-2">
                    <ListChecks className="size-4" />
                  </span>
                  <h2 className="truncate text-[14.5px] font-bold">
                    {list.name}
                  </h2>
                </div>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-white/40">
                  {list.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" />
                      {list.city}
                    </span>
                  )}
                  {list.industries.length > 0 && (
                    <span className="truncate">
                      {list.industries
                        .map((i) => INDUSTRY_LABEL[i] ?? i)
                        .join("، ")}
                    </span>
                  )}
                </p>
              </Link>

              <div className="flex items-center gap-4 text-[12px] text-white/55">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <Users className="size-3.5 text-white/30" />
                  {list.count} عميل
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold tabular text-lime-300">
                  <CircleDollarSign className="size-3.5" />
                  {formatMoney(list.value)}
                </span>
              </div>

              <p className="text-[10.5px] text-white/30">
                اتعملت {timeAgo(list.createdAt)}
              </p>

              <div className="mt-auto flex items-center gap-2 border-t border-line pt-3">
                <a
                  href={`/api/lists/${list.id}/export`}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-white/[0.04] py-2 text-[11.5px] font-bold text-white/75 hover:bg-white/[0.08]"
                >
                  <Download className="size-3.5" />
                  تصدير Excel
                </a>
                <button
                  onClick={() => deleteList(list.id)}
                  disabled={busyId === list.id}
                  className="grid size-8 shrink-0 place-items-center rounded-lg border border-red-500/20 bg-red-500/[0.07] text-red-300 transition-colors hover:bg-red-500/[0.14] disabled:opacity-50"
                  title="امسح القائمة"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {addOpen && (
        <NewListDialog
          onClose={() => setAddOpen(false)}
          onCreated={(list) => {
            setLists((prev) => (prev ? [list, ...prev] : [list]));
            setAddOpen(false);
          }}
        />
      )}
    </div>
  );
}

function NewListDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (list: ApiList) => void;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (data.list) onCreated(data.list);
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
        className="card relative z-10 w-full max-w-sm p-6 [animation:var(--animate-rise)]"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[16px] font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-brand/10 text-brand-2">
              <ListChecks className="size-4" />
            </span>
            قائمة جديدة
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg border border-line text-white/50 hover:bg-white/[0.06]"
          >
            <X className="size-4" />
          </button>
        </div>

        <Field label="اسم القائمة *">
          <TextInput
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: عيادات الرياض دفعة ١"
          />
        </Field>

        <button
          disabled={busy}
          className="mt-5 w-full rounded-xl bg-gradient-to-l from-brand to-[#d61f4b] py-3 text-[13.5px] font-bold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          {busy ? "بتتعمل…" : "أنشئ القائمة"}
        </button>
      </form>
    </div>
  );
}
