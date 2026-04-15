import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;

  const where =
    type === "resident"
      ? { residentId: id }
      : type === "applicant" || type === "future-resident"
      ? { applicantId: id }
      : type === "prospect"
      ? { prospectId: id }
      : null;

  if (!where) {
    return NextResponse.json({ error: "Invalid thread type" }, { status: 400 });
  }

  const outboundRows = await db.messageRecipient.findMany({
    where,
    include: {
      message: {
        select: {
          body: true,
          mode: true,
          sentAt: true,
          createdAt: true,
          media: {
            select: {
              url: true,
              kind: true,
              mimeType: true,
              filename: true,
            },
          },
        },
      },
    },
  });

  let inboundRows: {
    body: string;
    receivedAt: Date;
    twilioSid: string;
    media: { url: string; kind: string; mimeType: string | null; filename: string | null }[];
  }[] = [];

  const inboundWhere =
    type === "resident"
      ? { residentId: id }
      : type === "applicant" || type === "future-resident"
      ? { applicantId: id }
      : type === "prospect"
      ? { prospectId: id }
      : null;

  if (inboundWhere) {
    inboundRows = await db.inboundMessage.findMany({
      where: inboundWhere,
      select: {
        body: true,
        receivedAt: true,
        twilioSid: true,
        media: {
          select: {
            url: true,
            kind: true,
            mimeType: true,
            filename: true,
          },
        },
      },
    });
  }

  type TimelineItem = {
    type: "outbound" | "inbound";
    body: string;
    timestamp: string;
    status?: string;
    twilioSid?: string;
    media?: { url: string; kind: string; mimeType: string | null; filename: string | null }[];
  };

  const outbound: TimelineItem[] = outboundRows.map((r) => ({
    type: "outbound",
    body: r.message.body,
    timestamp: (r.message.sentAt ?? r.message.createdAt).toISOString(),
    status: r.status,
    media: r.message.media,
  }));

  const inbound: TimelineItem[] = inboundRows.map((r) => ({
    type: "inbound",
    body: r.body,
    timestamp: r.receivedAt.toISOString(),
    twilioSid: r.twilioSid,
    media: r.media,
  }));

  const timeline = [...outbound, ...inbound].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return NextResponse.json(timeline);
}
