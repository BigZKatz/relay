import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const applicant = await db.applicant.findUnique({ where: { id } });
  if (!applicant) {
    return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
  }
  if (applicant.status !== "future-resident") {
    return NextResponse.json({ error: "Applicant is not a future resident" }, { status: 400 });
  }

  const resident = await db.$transaction(async (tx) => {
    const createdResident = await tx.resident.create({
      data: {
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        phone: applicant.phone,
        email: applicant.email,
        unit: applicant.unit,
        status: "active",
        propertyId: applicant.propertyId,
      },
    });

    await tx.messageRecipient.updateMany({
      where: { applicantId: applicant.id },
      data: {
        residentId: createdResident.id,
        applicantId: null,
      },
    });

    await tx.inboundMessage.updateMany({
      where: { applicantId: applicant.id },
      data: {
        residentId: createdResident.id,
        applicantId: null,
      },
    });

    await tx.applicant.update({
      where: { id },
      data: { status: "moved-in" },
    });

    return createdResident;
  });

  return NextResponse.json({ resident });
}
