import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logCommunication } from "@/lib/entrata";
import { resolveInboundParticipant } from "@/lib/threading";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const fromPhone = formData.get("From") as string;
  const toPhone = formData.get("To") as string;
  const body = (formData.get("Body") as string) ?? "";
  const twilioSid = formData.get("MessageSid") as string;
  const numMedia = parseInt((formData.get("NumMedia") as string) ?? "0", 10);

  if (!fromPhone || !twilioSid) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  const participant = await resolveInboundParticipant(fromPhone, toPhone);

  const mediaItems = Array.from({ length: Number.isNaN(numMedia) ? 0 : numMedia }, (_, i) => {
    const url = formData.get(`MediaUrl${i}`) as string | null;
    const mimeType = formData.get(`MediaContentType${i}`) as string | null;
    const kind = mimeType?.startsWith("video/")
      ? "video"
      : mimeType?.startsWith("audio/")
      ? "audio"
      : mimeType === "application/pdf"
      ? "document"
      : "image";
    const filename = url ? url.split("/").pop() ?? null : null;
    return url
      ? {
          url,
          mimeType,
          filename,
          kind,
        }
      : null;
  }).filter(Boolean) as { url: string; mimeType: string | null; filename: string | null; kind: string }[];

  const inbound = await db.inboundMessage.create({
    data: {
      fromPhone,
      toPhone,
      body,
      twilioSid,
      residentId: participant.residentId,
      applicantId: participant.applicantId,
      prospectId: participant.prospectId,
      media: mediaItems.length
        ? {
            create: mediaItems,
          }
        : undefined,
    },
    include: {
      media: true,
    },
  });

  if (participant.residentId) {
    const logResult = await logCommunication({
      residentId: participant.residentId,
      messageId: inbound.id,
      body: body || `[${inbound.media.length} media attachment${inbound.media.length === 1 ? "" : "s"}]`,
      sentAt: inbound.receivedAt,
      channel: "sms",
      direction: "inbound",
    });

    await db.inboundMessage.update({
      where: { id: inbound.id },
      data: { entraLogged: logResult.success },
    });
  }

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    }
  );
}
