import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const [messages, total] = await Promise.all([
    db.message.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { name: true } },
        recipients: {
          select: {
            status: true,
            twilioSid: true,
            sentAt: true,
            resident: {
              select: { firstName: true, lastName: true, unit: true },
            },
          },
        },
      },
    }),
    db.message.count(),
  ]);

  return NextResponse.json({ messages, total });
}
