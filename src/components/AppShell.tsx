"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Radar,
  Users,
  Columns3,
  Workflow,
  Sparkles,
  ListChecks,
} from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/scout", label: "رادار الاستكشاف", icon: Radar },
  { href: "/lists", label: "القوائم", icon: ListChecks },
  { href: "/leads", label: "قاعدة العملاء", icon: Users },
  { href: "/pipeline", label: "خط البيع", icon: Columns3 },
  { href: "/workflows", label: "كتالوج الورك فلو", icon: Workflow },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-60 flex-col border-e border-line bg-panel/80 px-4 py-6 backdrop-blur-xl lg:flex">
        <Link href="/" className="group mb-9 flex items-center gap-3 px-2">
          <span className="relative grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand to-[#b3123f] shadow-[0_8px_24px_-6px_rgb(255_77_109/0.6)]">
            <Radar className="size-5 text-white" strokeWidth={2.2} />
            <span className="absolute inset-0 rounded-xl bg-brand/40 blur-lg group-hover:blur-xl transition-all" />
          </span>
          <span>
            <span className="block text-[15px] font-bold leading-tight">
              رادار العملاء
            </span>
            <span className="block text-[11px] text-white/40 leading-tight">
              صيّاد عملاء n8n
            </span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium transition-all duration-300",
                  active
                    ? "bg-white/[0.06] text-white"
                    : "text-white/45 hover:bg-white/[0.03] hover:text-white/80",
                )}
              >
                {active && (
                  <span className="absolute end-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-brand to-brand-2 shadow-[0_0_12px_rgb(255_77_109/0.8)]" />
                )}
                <item.icon
                  className={clsx(
                    "size-[18px]",
                    active ? "text-brand-2" : "text-white/35",
                  )}
                  strokeWidth={2}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="card relative overflow-hidden p-4">
          <div className="absolute -left-6 -top-8 size-24 rounded-full bg-brand/15 blur-2xl" />
          <div className="flex items-center gap-2 text-[11px] font-semibold text-brand-2">
            <Sparkles className="size-3.5" />
            نصيحة الصيّاد
          </div>
          <p className="mt-2 text-[11.5px] leading-5 text-white/55">
            العميل اللي بترد عليه خلال أول ساعة، فرصته في الإقفال أعلى ٣ مرات.
            حرّك كروت خط البيع كل يوم.
          </p>
        </div>
      </aside>

      {/* Top bar — mobile */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-ink/85 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-brand to-[#b3123f]">
            <Radar className="size-4.5 text-white" />
          </span>
          <span className="text-sm font-bold">رادار العملاء</span>
        </Link>
      </header>

      {/* Bottom nav — mobile */}
      <nav className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-1 rounded-2xl border border-line bg-panel/90 px-2 py-2 backdrop-blur-xl lg:hidden">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors",
                active ? "text-brand-2" : "text-white/40",
              )}
            >
              <item.icon className="size-[18px]" />
              {item.label.split(" ").pop()}
            </Link>
          );
        })}
      </nav>

      <main className="px-4 pb-28 pt-6 sm:px-6 lg:ms-60 lg:px-10 lg:pb-14 lg:pt-9">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
