"use client";

import type { ReactNode } from "react";
import clsx from "clsx";
import {
  MessageCircle,
  AtSign,
  Mail,
  Phone,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { STATUS_META, type LeadStatus, scoreTone } from "@/lib/constants";

/* ---------------- Score ring ---------------- */

export function ScoreRing({
  score,
  size = 44,
  stroke = 3.5,
}: {
  score: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tone = scoreTone(score);
  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      title={`تقييم الفرصة: ${score}/100 — ${tone.label}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone.ring}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (score / 100) * c}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <span
        className={clsx("absolute text-[11px] font-bold tabular", tone.text)}
      >
        {score}
      </span>
    </div>
  );
}

/* ---------------- Status chip ---------------- */

export function StatusChip({ status }: { status: LeadStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        meta.chip,
      )}
    >
      <span className={clsx("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}

/* ---------------- Channel icon ---------------- */

const CHANNEL_ICON: Record<string, LucideIcon> = {
  whatsapp: MessageCircle,
  instagram: AtSign,
  email: Mail,
  phone: Phone,
  linkedin: Briefcase,
};

export function ChannelIcon({
  channel,
  className,
}: {
  channel: string;
  className?: string;
}) {
  const Icon = CHANNEL_ICON[channel] ?? MessageCircle;
  return <Icon className={className ?? "size-4"} strokeWidth={2} />;
}

/* ---------------- Page header ---------------- */

export function PageHeader({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">
          {title}
        </h1>
        {sub && <p className="mt-1.5 text-[13px] text-white/45">{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-2.5">{children}</div>}
    </div>
  );
}

/* ---------------- Empty state ---------------- */

export function EmptyState({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="card grid place-items-center gap-2 px-6 py-14 text-center">
      <p className="text-[15px] font-bold">{title}</p>
      {hint && <p className="max-w-sm text-[12.5px] leading-6 text-white/40">{hint}</p>}
      {children}
    </div>
  );
}

/* ---------------- Form primitives ---------------- */

const fieldBase =
  "w-full rounded-xl border border-line bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-white placeholder:text-white/25 transition-colors focus:border-brand/50 focus:bg-white/[0.06]";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={clsx("block", className)}>
      <span className="mb-1.5 block text-[11.5px] font-semibold text-white/50">
        {label}
      </span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx(fieldBase, props.className)} />;
}

export function SelectInput(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return (
    <select
      {...props}
      className={clsx(fieldBase, "appearance-none", props.className)}
    />
  );
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      rows={3}
      {...props}
      className={clsx(fieldBase, "resize-none", props.className)}
    />
  );
}

/* ---------------- Skeleton ---------------- */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-xl border border-line bg-white/[0.03]",
        className,
      )}
    />
  );
}
