import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";

const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "رادار العملاء — بِع ورك فلو n8n لأصحاب البيزنس",
  description:
    "لوحة تحكم ذكية تكتشف العملاء المحتملين، ترتّب الفرص، وتدير خط البيع — مخصصة لبيع أتمتة وورك فلو n8n.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={plex.variable}>
      <body className="min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
