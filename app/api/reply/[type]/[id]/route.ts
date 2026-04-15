import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendSMS } from "@/lib/twilio";
import { logCommunication } from "@/lib/entrata";
import type { UploadedMedia } from "@/lib/media";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;
  const { body, media } = (await req.json()) as { body?: string; media?: UploadedMedia[] };
  const trimmedBody = body?.trim() ?? "";
  const attachments = Array.isArray(media) ? media.filter((item) => item?.url) : [];

  if (!trimmedBody && attachments.length === 0) {
    return NextResponse.json({ error: "Message body or media is required." }, { status: 400 });
  }

  const person =
    type === "resident"
      ? await db.resident.findUnique({
          where: { id },
          select: { id: true, phone: true, firstName: true, lastName: true, unit: true, propertyId: true },
        })
      : type === "applicant" || type === "future-resident"
      ? await db.applicant.findUnique({
          where: { id },
          select: { id: true, phone: true, firstName: true, lastName: true, unit: true, propertyId: true },
        })
      : type === "prospect"
      ? await db.prospect.findUnique({
          where: { id },
          select: { id: true, phone: true, firstName: true, lastName: true, unitInterest: true, propertyId: true },
        })
      : null;

  if (!person) {
    return NextResponse.json({ error: "Participant not found." }, { status: 404 });
  }

  const phone = person.phone;
  const unit = "unit" in person ? person.unit : person.unitInterest ?? "";
  const storedBody = trimmedBody || `[${attachments.length} attachment${attachments.length === 1 ? "" : "s"}]`;
  const result = await sendSMS(phone, trimmedBody, attachments.map((item) => item.url));

  const message = await db.message.create({
    data: {
      body: storedBody,
      mode: "personalized",
      status: result.success ? "sent" : "failed",
      sentAt: new Date(),
      propertyId: person.propertyId,
      entraLogged: false,
      recipients: {
        create:
          type === "resident"
            ? {
                residentId: person.id,
                phone,
                status: result.success ? "delivered" : "failed",
                twilioSid: result.sid ?? null,
                sentAt: result.success ? new Date() : null,
              }
            : type === "applicant" || type === "future-resident"
            ? {
                applicantId: person.id,
                phone,
                status: result.success ? "delivered" : "failed",
                twilioSid: result.sid ?? null,
                sentAt: result.success ? new Date() : null,
              }
            : {
                prospectId: person.id,
                phone,
                status: result.success ? "delivered" : "failed",
                twilioSid: result.sid ?? null,
                sentAt: result.success ? new Date() : null,
              },
      },
      media: attachments.length
        ? {
            create: attachments.map((item) => ({
              url: item.url,
              kind: item.kind,
              mimeType: item.mimeType,
              filename: item.filename,
            })),
          }
        : undefined,
    },
  });

  if (result.success && type === "resident") {
    const logResult = await logCommunication({
      residentId: person.id,
      messageId: message.id,
      body: storedBody,
      sentAt: new Date(),
      channel: "sms",
      direction: "outbound",
    });

    await db.message.update({
      where: { id: message.id },
      data: {
        entraLogged: logResult.success,
        entraLogId: logResult.success ? logResult.entraLogId ?? null : null,
      },
    });
  }

  return NextResponse.json({
    success: result.success,
    messageId: message.id,
    sent: result.success ? 1 : 0,
    failed: result.success ? 0 : 1,
    participant: {
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      phone,
      unit,
      type,
    },
  });
}
