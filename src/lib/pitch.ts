import type { ApiLead, ApiWorkflow } from "./types";
import { INDUSTRY_LABEL, formatMoney } from "./constants";

/**
 * Hand-written, step-by-step explanations of how each catalog workflow
 * actually runs mechanically once it's installed for a client. Keyed by
 * workflow id from the seed catalog. Written to be true for ANY business
 * that buys that workflow — the per-lead personalization happens in the
 * intro/outro text built around these steps, not inside them.
 */
const WORKFLOW_STEPS: Record<number, string[]> = {
  1: [
    'لما عميل يبعت رسالة على واتساب، الورك فلو ياخدها فورًا ويحللها بالذكاء الاصطناعي (OpenAI) عشان يفهم طلبه بالظبط.',
    'يرد عليه في ثواني بلهجتك ونبرة بيزنسك، ويجاوب على الأسئلة المتكررة زي الأسعار والمواعيد والفروع.',
    'لو السؤال معقد أو محتاج تدخل بشري، يحوّل المحادثة للموظف المختص فورًا مع ملخص سريع للمحادثة.',
    'كل محادثة بتتسجل تلقائي في Google Sheets عشان تقدر تتابع الأداء والأسئلة اللي بتتكرر كتير.',
  ],
  2: [
    'لما عميل يعمل طلب جديد على المتجر (WooCommerce)، الورك فلو يمسكه فورًا لحظة ما يتسجل.',
    'يسجله تلقائي في Google Sheets منظم بكل التفاصيل: المنتج، السعر، وبيانات العميل.',
    'يبعت إشعار فوري على Telegram للفريق عشان يجهزوا الطلب من غير أي تأخير.',
    'يبعت رسالة تأكيد تلقائية للعميل إن طلبه اتسجل وهيتنفذ.',
  ],
  3: [
    'الورك فلو بيراقب المتجر (Shopify) على طول ويكتشف أي عربة اتسابت من غير ما العميل يكمل الدفع.',
    'بعد فترة قصيرة، يبعت رسالة تذكير لطيفة على واتساب أو إيميل (Gmail) فيها نفس المنتجات اللي كانت في السلة.',
    'لو مفيش رد، يبعت رسالة تانية فيها خصم بسيط يشجع العميل يرجع يكمل الشراء.',
    'لما العميل يكمل الطلب، الورك فلو يوقف التذكيرات تلقائي من غير أي تدخل.',
  ],
  4: [
    'لما حد يتفاعل مع إعلان على فيسبوك أو جوجل، بياناته بتتسجل فورًا في نظام CRM (HubSpot).',
    'الورك فلو يبعتله رسالة ترحيب تلقائية على الإيميل (Gmail) خلال دقايق من التفاعل.',
    'يطلق سلسلة متابعة تلقائية على مدار كام يوم لحد ما العميل يرد أو يحجز.',
    'كل عميل محتمل بيتصنف حسب مستوى اهتمامه عشان فريق المبيعات يركز على الأهم الأول.',
  ],
  5: [
    'تجهز المحتوى مرة واحدة، والورك فلو ينشره تلقائي على انستجرام وX ولينكدإن في المواعيد اللي تحددها.',
    'جدولة أسبوعية أو شهرية بالكامل — تحدد المواعيد مرة واحدة وهو يلتزم بيها لوحده.',
    'تقرير أداء أسبوعي (تفاعل، وصول، وأفضل بوست) بيوصلك على Telegram من غير ما تفتح أي لوحة تحكم.',
  ],
  6: [
    'الفواتير بتتسجل وتتابع أوتوماتيك من نظام الدفع (Stripe) وبتتحدث في Google Sheets لحظة بلحظة.',
    'لو فاتورة اتأخرت، الورك فلو يبعت تذكير مهذب على واتساب للعميل من غير ما حد يدخل يدوي.',
    'لو التأخير استمر، يبعت تذكير تاني بنبرة أقوى شوية بعد فترة محددة.',
    'لما الدفع يوصل، يتحدث في الشيت تلقائي ويوقف التذكيرات لوحده.',
  ],
  7: [
    'العميل يحجز موعد (أونلاين أو تليفون)، والورك فلو يسجله فورًا في Google Calendar.',
    'يبعت رسالة تأكيد على واتساب فيها كل تفاصيل الموعد: اليوم والوقت والمكان أو لينك Zoom.',
    'قبل الموعد بفترة محددة، يبعت تذكير تلقائي بيقلل نسبة الغياب بشكل كبير.',
    'لو حصل تعارض في المواعيد، الورك فلو يبعت تنبيه فورًا قبل ما يبقى مشكلة.',
  ],
  8: [
    'الورك فلو يجمع بيانات المبيعات والطلبات يوميًا من مصادرك (Stripe وGoogle Sheets).',
    'يحسب الأرقام المهمة: إجمالي المبيعات، عدد الطلبات، وأعلى المنتجات مبيعًا.',
    'يبعتلك تقرير مختصر وواضح على Telegram كل مساء، من غير ما تفتح أي لوحة تحكم أو تجمع بيانات يدوي.',
  ],
};

/** Generic fallback for any workflow outside the hand-written map above. */
function genericSteps(workflow: ApiWorkflow): string[] {
  const ints = workflow.integrations.length
    ? workflow.integrations.join("، ")
    : "أدواتك الحالية";
  return [
    `الورك فلو يشتغل في الخلفية على طول، متوصّل بـ ${ints}.`,
    `${workflow.description}`,
    `النتيجة إنه بيلغي الخطوة اليدوية المتكررة دي خالص من غير ما حد يقعد يتابعها.`,
  ];
}

export function buildWorkflowSteps(workflow: ApiWorkflow): string[] {
  return WORKFLOW_STEPS[workflow.id] ?? genericSteps(workflow);
}

/** Personalized intro + steps + outro, ready to render as one block. */
export function buildWorkflowExplanation(
  lead: ApiLead,
  workflow: ApiWorkflow,
): { intro: string; steps: string[]; outro: string } {
  const painClause = lead.painPoint
    ? `بما إن "${lead.businessName}" بيواجه المشكلة دي: "${lead.painPoint}"،`
    : `عشان "${lead.businessName}" يشتغل بكفاءة أكتر،`;

  return {
    intro: `${painClause} الورك فلو "${workflow.name}" هيشتغل كالتالي بمجرد ما يتركّب:`,
    steps: buildWorkflowSteps(workflow),
    outro: `🎯 النتيجة: بيوفّرلك حوالي ${workflow.hoursSaved} ساعة شغل يدوي كل أسبوع، ويشتغل لوحده من غير أي متابعة منك.`,
  };
}

/** Ready-to-send opening message for the lead's chat (WhatsApp/Instagram/etc). */
export function buildOpeningMessage(
  lead: ApiLead,
  workflow: ApiWorkflow | null,
): string {
  const greetTarget = lead.contactName ? ` يا ${lead.contactName}` : "";
  const industryLabel = INDUSTRY_LABEL[lead.industry] ?? "";
  const painClause = lead.painPoint
    ? `لاحظت إن "${lead.businessName}" بيواجه المشكلة دي: "${lead.painPoint}".`
    : `لاحظت إن "${lead.businessName}" ممكن يستفيد من أتمتة بتوفر وقت وجهد في الشغل اليومي${
        industryLabel ? ` في مجال ${industryLabel}` : ""
      }.`;

  if (!workflow) {
    return [
      `السلام عليكم${greetTarget}،`,
      "",
      painClause,
      "",
      "عندنا حلول أتمتة (n8n) بتلغي الشغل اليدوي المتكرر ده خالص. تحب تحكيلي أكتر عن طريقة شغلكم دلوقتي عشان أقترحلك الحل المناسب؟",
    ].join("\n");
  }

  return [
    `السلام عليكم${greetTarget}،`,
    "",
    painClause,
    "",
    `عندي حل جاهز اسمه "${workflow.name}" (${workflow.category}) بيحل المشكلة دي تلقائيًا بالأتمتة والذكاء الاصطناعي — بيوفّرلك حوالي ${workflow.hoursSaved} ساعة شغل يدوي كل أسبوع.`,
    "",
    `السعر: ${formatMoney(workflow.price)} تركيب مرة واحدة، وبيشتغل لوحده بعد كده من غير أي متابعة.`,
    "",
    "تحب أوريك عرض توضيحي سريع (٥ دقايق بس) وتشوف الفرق بنفسك؟",
  ].join("\n");
}
