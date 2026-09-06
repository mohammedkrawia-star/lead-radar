export const STATUS_ORDER = [
  "new",
  "contacted",
  "replied",
  "meeting",
  "negotiating",
  "won",
  "lost",
] as const;

export type LeadStatus = (typeof STATUS_ORDER)[number];

export const STATUS_META: Record<
  LeadStatus,
  { label: string; dot: string; chip: string; bar: string }
> = {
  new: {
    label: "جديد",
    dot: "bg-sky-400",
    chip: "bg-sky-400/10 text-sky-300 border-sky-400/20",
    bar: "bg-sky-400",
  },
  contacted: {
    label: "تم التواصل",
    dot: "bg-amber-400",
    chip: "bg-amber-400/10 text-amber-300 border-amber-400/20",
    bar: "bg-amber-400",
  },
  replied: {
    label: "ردّ علينا",
    dot: "bg-violet-400",
    chip: "bg-violet-400/10 text-violet-300 border-violet-400/20",
    bar: "bg-violet-400",
  },
  meeting: {
    label: "اجتماع",
    dot: "bg-cyan-400",
    chip: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
    bar: "bg-cyan-400",
  },
  negotiating: {
    label: "تفاوض",
    dot: "bg-orange-400",
    chip: "bg-orange-400/10 text-orange-300 border-orange-400/20",
    bar: "bg-orange-400",
  },
  won: {
    label: "صفقة ناجحة",
    dot: "bg-lime-400",
    chip: "bg-lime-400/10 text-lime-300 border-lime-400/20",
    bar: "bg-lime-400",
  },
  lost: {
    label: "ضاعت",
    dot: "bg-zinc-500",
    chip: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    bar: "bg-zinc-500",
  },
};

export const INDUSTRIES = [
  { value: "ecommerce", label: "متاجر إلكترونية" },
  { value: "clinic", label: "عيادات ومراكز طبية" },
  { value: "realestate", label: "عقارات" },
  { value: "restaurant", label: "مطاعم وكافيهات" },
  { value: "agency", label: "وكالات تسويق" },
  { value: "education", label: "تعليم وكورسات" },
  { value: "logistics", label: "شحن ولوجستيات" },
  { value: "beauty", label: "صالونات وسبا" },
] as const;

export type Industry = (typeof INDUSTRIES)[number]["value"];

export const INDUSTRY_LABEL: Record<string, string> = Object.fromEntries(
  INDUSTRIES.map((i) => [i.value, i.label]),
);

export const CITIES = [
  "الرياض",
  "جدة",
  "دبي",
  "أبوظبي",
  "القاهرة",
  "الدوحة",
  "الكويت",
  "عمّان",
  "المنامة",
  "الدار البيضاء",
];

export const CHANNELS = [
  { value: "whatsapp", label: "واتساب" },
  { value: "instagram", label: "انستجرام" },
  { value: "email", label: "إيميل" },
  { value: "phone", label: "مكالمة" },
  { value: "linkedin", label: "لينكدإن" },
] as const;

export const CHANNEL_LABEL: Record<string, string> = Object.fromEntries(
  CHANNELS.map((c) => [c.value, c.label]),
);

export const SIZES = [
  { value: "solo", label: "فردي" },
  { value: "small", label: "صغير (2-10)" },
  { value: "medium", label: "متوسط (10-50)" },
  { value: "large", label: "كبير (+50)" },
] as const;

export const SIZE_LABEL: Record<string, string> = Object.fromEntries(
  SIZES.map((s) => [s.value, s.label]),
);

export function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function timeAgo(date: string | Date | null): string {
  if (!date) return "أبدًا";
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `من ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `من ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `من ${days} يوم`;
  const months = Math.floor(days / 30);
  return `من ${months} شهر`;
}

export function scoreTone(score: number): {
  text: string;
  ring: string;
  label: string;
} {
  if (score >= 80)
    return { text: "text-lime-300", ring: "#a3e635", label: "ساخن" };
  if (score >= 60)
    return { text: "text-amber-300", ring: "#fbbf24", label: "دافئ" };
  return { text: "text-sky-300", ring: "#38bdf8", label: "بارد" };
}
