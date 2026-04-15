import { db } from "@/lib/db";

function normalizePhone(phone: string | null | undefined) {
  return (phone ?? "").replace(/\D/g, "");
}

export function phoneVariants(phone: string | null | undefined) {
  const digits = normalizePhone(phone);
  if (!digits) return [] as string[];

  const variants = new Set<string>([digits]);
  if (digits.length === 11 && digits.startsWith("1")) {
    variants.add(digits.slice(1));
  }
  if (digits.length === 10) {
    variants.add(`1${digits}`);
  }

  return [...variants];
}

export async function resolveInboundParticipant(fromPhone: string, toPhone?: string | null) {
  const variants = phoneVariants(fromPhone);
  if (variants.length === 0) {
    return { residentId: null, applicantId: null, prospectId: null };
  }

  const toVariants = phoneVariants(toPhone);

  // Query directly by phone variants — no arbitrary row limit
  const recipient = await db.messageRecipient.findFirst({
    where: {
      phone: { in: variants },
      ...(toVariants.length > 0
        ? { message: { property: { twilioNumber: { in: toVariants } } } }
        : {}),
    },
    orderBy: [{ sentAt: "desc" }],
    select: {
      residentId: true,
      applicantId: true,
      prospectId: true,
    },
  });

  if (recipient) {
    return {
      residentId: recipient.residentId ?? null,
      applicantId: recipient.applicantId ?? null,
      prospectId: recipient.prospectId ?? null,
    };
  }


  const [resident, applicant, prospect] = await Promise.all([
    db.resident.findFirst({ where: { phone: { in: variants } }, select: { id: true } }),
    db.applicant.findFirst({ where: { phone: { in: variants } }, select: { id: true } }),
    db.prospect.findFirst({ where: { phone: { in: variants } }, select: { id: true } }),
  ]);

  return {
    residentId: resident?.id ?? null,
    applicantId: applicant?.id ?? null,
    prospectId: prospect?.id ?? null,
  };
}
