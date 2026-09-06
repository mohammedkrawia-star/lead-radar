// Shared catalog + prospect-generation intelligence used by the seed script
// and the /api/scout route.

export const WORKFLOW_SEED = [
  {
    name: "المتحدّث الآلي",
    description:
      "رد ذكي على رسائل واتساب بالذكاء الاصطناعي، يفهم استفسار العميل ويرد بلهجتك ويحوّل للموظف لما الموضوع يكبر.",
    category: "دعم العملاء",
    price: 390,
    nodes: 14,
    integrations: ["WhatsApp", "OpenAI", "Google Sheets"],
    hoursSaved: 32,
  },
  {
    name: "صائد الطلبات",
    description:
      "كل طلب جديد من المتجر يتسجّل في الشيت ويترتّب لوحده، مع إشعار فوري للفريق وتأكيد تلقائي للعميل.",
    category: "مبيعات",
    price: 240,
    nodes: 9,
    integrations: ["WooCommerce", "Google Sheets", "Telegram"],
    hoursSaved: 18,
  },
  {
    name: "إنقاذ السلّات",
    description:
      "يرصد العربات المتروكة ويرسل تسلسل رسائل استرجاع (واتساب + إيميل) بخصم ذكي يرجّع العميل يكمل الشراء.",
    category: "مبيعات",
    price: 420,
    nodes: 12,
    integrations: ["Shopify", "WhatsApp", "Gmail"],
    hoursSaved: 22,
  },
  {
    name: "مصنع الليدز",
    description:
      "يلتقط العملاء من إعلانات فيسبوك وجوجل، يسجّلهم في CRM، ويطلق سلسلة متابعة تلقائية بدون ما حد ينسى حد.",
    category: "تسويق",
    price: 480,
    nodes: 16,
    integrations: ["Facebook Ads", "HubSpot", "Gmail"],
    hoursSaved: 26,
  },
  {
    name: "الناشر الذكي",
    description:
      "جدولة ونشر تلقائي على كل منصات السوشيال ميديا من مكان واحد، مع تقرير أداء أسبوعي جاهز.",
    category: "تسويق",
    price: 310,
    nodes: 11,
    integrations: ["Instagram", "X", "LinkedIn", "Telegram"],
    hoursSaved: 20,
  },
  {
    name: "المحصّل",
    description:
      "فواتير تتبعت تلقائيًا، وتذكيرات دفع مهذبة على واتساب وإيميل لحد ما الفلوس توصل حسابك.",
    category: "مالية",
    price: 260,
    nodes: 10,
    integrations: ["Stripe", "Google Sheets", "WhatsApp"],
    hoursSaved: 15,
  },
  {
    name: "منظّم المواعيد",
    description:
      "حجز + تأكيد + تذكير تلقائي قبل الموعد، ومزامنة كاملة مع جوجل كاليندر. وداعًا للمواعيد الضايعة.",
    category: "عمليات",
    price: 330,
    nodes: 13,
    integrations: ["Google Calendar", "WhatsApp", "Zoom"],
    hoursSaved: 24,
  },
  {
    name: "عينك على الأرقام",
    description:
      "تقرير مبيعات يومي مختصر يوصلك على تيليجرام كل مساء: مبيعات، طلبات، وأعلى منتجات — بدون ما تفتح أي لوحة.",
    category: "تقارير",
    price: 190,
    nodes: 8,
    integrations: ["Google Sheets", "Telegram", "Stripe"],
    hoursSaved: 12,
  },
] as const;

export const INDUSTRY_INTEL: Record<
  string,
  { workflows: string[]; businesses: string[]; pains: string[] }
> = {
  ecommerce: {
    workflows: ["إنقاذ السلّات", "صائد الطلبات"],
    businesses: [
      "متجر لمسة",
      "متجر عود وعنبر",
      "نوفا ستور",
      "متجر كشخة",
      "ستايلي شوب",
      "قطرة ندى ستور",
      "متجر جوهرة",
      "دلع ستور",
    ],
    pains: [
      "طلبات كتير على واتساب وانستجرام ومفيش نظام بيتابعها — طلبات بتضيع وردود متأخرة بتخسّر مبيعات",
      "سلات متروكة كتير كل يوم ومفيش أي متابعة بترجّع العميل يكمل الشراء",
      "تسجيل الطلبات يدوي في إكسل بياخد من الفريق ٣ ساعات يوميًا وأخطاء كتير",
    ],
  },
  clinic: {
    workflows: ["منظّم المواعيد", "المتحدّث الآلي"],
    businesses: [
      "عيادات إبتسامة",
      "مركز النخبة الطبي",
      "عيادات شفاء",
      "رويال كير",
      "مركز النور لطب الأسنان",
      "عيادات ديرما بوينت",
    ],
    pains: [
      "نسبة عدم حضور المواعيد فوق ٣٠٪ ومفيش تذكير تلقائي للمرضى",
      "الاستقبال بيرد على نفس الأسئلة طوال اليوم على واتساب — وقت ضايع وضغط على الموظفين",
      "مواعيد بتتلغي في آخر لحظة ومفيش قائمة انتظار بتتملي أوتوماتيك",
    ],
  },
  realestate: {
    workflows: ["مصنع الليدز", "المتحدّث الآلي"],
    businesses: [
      "الديار العقارية",
      "شركة الأفق للتطوير",
      "صروح العقارية",
      "تمكين للعقارات",
      "المعتز للتسويق العقاري",
      "بوابة الخليج العقارية",
    ],
    pains: [
      "ليدز جاية من منصات كتير ومحدش بيتابعها في وقتها — العميل بيروح للمنافس خلال ساعات",
      "فريق المبيعات بيسجّل البيانات يدوي والمتابعات بتتنسى بعد أول اتصال",
      "مفيش تصنيف تلقائي للعملاء الجادين من اللي بيسأل بس",
    ],
  },
  restaurant: {
    workflows: ["عينك على الأرقام", "صائد الطلبات"],
    businesses: [
      "مطعم زعفران",
      "بيت المشاوي",
      "ضيافة كافيه",
      "قرمشة برجر",
      "مطبخ البيت",
      "شواية الديوان",
    ],
    pains: [
      "طلبات من تطبيقات توصيل مختلفة ومفيش تقرير موحد — الأرقام بتتجمع يدوي كل ليلة",
      "تقييمات جوجل وانستجرام ملهاش رد سريع وبتأثر على السمعة",
      "الطلبات المكررة مش متسجلة — مفيش ولاء ولا متابعة للعملاء الدائمين",
    ],
  },
  agency: {
    workflows: ["الناشر الذكي", "عينك على الأرقام"],
    businesses: [
      "وكالة بكسل",
      "إبداع ميديا",
      "صدى للتسويق",
      "زوم ميديا",
      "وكالة نبض",
      "فيوجن ديجيتال",
    ],
    pains: [
      "تقارير العملاء بتتعمل يدوي كل أسبوع وبتاخد يوم كامل من الفريق",
      "النشر على منصات العملاء بيتم يدوي حساب بحساب — هدر وقت مهول",
      "تسليم المحتوى والاعتمادات بيتم على واتساب ومفيش نظام متابعة واضح",
    ],
  },
  education: {
    workflows: ["المحصّل", "مصنع الليدز"],
    businesses: [
      "أكاديمية مهارة",
      "منصة نمو",
      "أكاديمية المستقبل",
      "معهد خطوة",
      "كورساتي",
      "مدارك التعليمية",
    ],
    pains: [
      "تسجيل الطلاب ومتابعة الأقساط يدوي على إكسل — أخطاء وفلوس بتتأخر",
      "تذكير الطلاب بالحصص والواجبات بيتم يدوي لكل طالب",
      "استفسارات التسجيل بتوصل من كل مكان ومفيش رد سريع بيحوّلها لاشتراكات",
    ],
  },
  logistics: {
    workflows: ["المتحدّث الآلي", "عينك على الأرقام"],
    businesses: [
      "سريع للشحن",
      "وصّلها إكسبرس",
      "مسار لوجستك",
      "أسطول ديليفري",
      "برق للتوصيل",
    ],
    pains: [
      "استفسارات (فين الشحنة؟) كل يوم على التليفون — تحديثات الحالة بتتعمل يدوي",
      "إشعارات التسليم والتأخير مش بتوصل للعملاء إلا بعد ما يتصلوا هم",
      "تقارير التشغيل اليومية بتتستخرج يدوي من ملفات كتير",
    ],
  },
  beauty: {
    workflows: ["منظّم المواعيد", "المتحدّث الآلي"],
    businesses: [
      "صالون ليدي روز",
      "سبا غلامور",
      "صالون لونا",
      "مشغل دانة",
      "سبا السلطانة",
      "بيوتي كوين",
    ],
    pains: [
      "الحجوزات على واتساب ودفتر ورقي — تداخلات ومواعيد ضايعة كل أسبوع",
      "العميلات بينسوا مواعيدهم ومفيش تأكيد أو تذكير تلقائي",
      "مفيش نظام بيفتكر العميلة اللي ماجتش من شهر ويرسلها عرض يرجّعها",
    ],
  },
};

export const CONTACT_NAMES = [
  "أحمد الهاشمي",
  "محمد الشريف",
  "سارة العتيبي",
  "نورة القحطاني",
  "خالد المصري",
  "ليلى حسن",
  "عمر بدوي",
  "ريم سالم",
  "يوسف ناجي",
  "هند الزهراني",
  "طارق عز",
  "مريم خليل",
  "فهد الحربي",
  "دينا سامي",
  "كريم فؤاد",
  "آية محمود",
];

export const CONTACT_ROLES = [
  "صاحب النشاط",
  "صاحبة البراند",
  "مدير التشغيل",
  "مديرة التسويق",
  "مسؤول المبيعات",
  "مدير خدمة العملاء",
];

const CHANNEL_POOL = [
  "whatsapp",
  "whatsapp",
  "whatsapp",
  "instagram",
  "email",
  "phone",
  "linkedin",
];

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

export interface GeneratedLead {
  businessName: string;
  contactName: string;
  contactRole: string;
  industry: string;
  city: string;
  channel: string;
  size: string;
  painPoint: string;
  score: number;
  matchedWorkflow: string;
  setupFee: number;
}

export function generateProspect(
  industry: string,
  cities: string[],
  rng: () => number = Math.random,
): GeneratedLead {
  const intel = INDUSTRY_INTEL[industry] ?? INDUSTRY_INTEL.ecommerce;
  const sizes = ["solo", "small", "small", "medium", "medium", "large"];
  const matchedWorkflow = pick(intel.workflows, rng);
  const base = pick([180, 220, 270, 320, 380, 430], rng);

  return {
    businessName: pick(intel.businesses, rng),
    contactName: pick(CONTACT_NAMES, rng),
    contactRole: pick(CONTACT_ROLES, rng),
    industry,
    city: pick(cities, rng),
    channel: pick(CHANNEL_POOL, rng),
    size: pick(sizes, rng),
    painPoint: pick(intel.pains, rng),
    score: Math.min(96, Math.floor(55 + rng() * 42)),
    matchedWorkflow,
    setupFee: base,
  };
}
