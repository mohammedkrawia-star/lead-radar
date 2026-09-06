// Tiny CSV builder — no dependency needed. Adds a UTF-8 BOM so Excel opens
// Arabic text correctly instead of mangling it into question marks.

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const BOM = "﻿";

export function toCsv(
  columns: { key: string; label: string }[],
  rows: Record<string, unknown>[],
): string {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvCell(row[c.key])).join(","),
  );
  return BOM + [header, ...lines].join("\r\n");
}

export function csvResponse(filename: string, csv: string): Response {
  // RFC 5987 encoding so Arabic filenames survive across browsers — a plain
  // ASCII fallback plus filename*=UTF-8'' for the real one.
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(filename);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`,
    },
  });
}
