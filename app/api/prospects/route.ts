import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const prospects = await db.prospect.findMany({
    orderBy: [{ createdAt: "desc" }],
    include: {
      property: { select: { id: true, name: true } },
      messages: { select: { messageId: true } },
    },
  });
  return NextResponse.json({ prospects });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, phone, email, unitInterest, notes, source, propertyId } = body;

    if (!firstName || !lastName || !phone || !propertyId) {
      return NextResponse.json({ error: "firstName, lastName, phone, and propertyId are required" }, { status: 400 });
    }
    if (!/^\+?1?\d{10,14}$/.test(String(phone).replace(/[\s\-().]/g, ""))) {
      return NextResponse.json({ error: "Phone number format is invalid" }, { status: 422 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
      return NextResponse.json({ error: "Email address format is invalid" }, { status: 422 });
    }

    const property = await db.property.findUnique({ where: { id: propertyId }, select: { id: true } });
    if (!property) {
      return NextResponse.json({ error: "Selected property was not found." }, { status: 400 });
    }

    const prospect = await db.prospect.create({
      data: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        phone: String(phone).trim(),
        email: email ? String(email).trim() : null,
        unitInterest: unitInterest ? String(unitInterest).trim() : null,
        notes: notes ? String(notes).trim() : null,
        source: source ? String(source).trim() : null,
        propertyId,
      },
      include: {
        property: { select: { id: true, name: true } },
        messages: { select: { messageId: true } },
      },
    });

    return NextResponse.json({ prospect }, { status: 201 });
  } catch (error) {
    const err = error as { message?: string };
    return NextResponse.json({ error: err.message ?? "Could not create prospect." }, { status: 500 });
  }
}
