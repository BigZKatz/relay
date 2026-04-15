import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const prospect = await db.prospect.findUnique({ where: { id } });
  if (!prospect) {
    return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
  }
  if (prospect.status === "converted") {
    return NextResponse.json({ error: "Prospect already converted" }, { status: 400 });
  }

  const applicant = await db.$transaction(async (tx) => {
    const createdApplicant = await tx.applicant.create({
      data: {
        firstName: prospect.firstName,
        lastName: prospect.lastName,
        phone: prospect.phone,
        email: prospect.email,
        unit: prospect.unitInterest ?? "TBD",
        status: "pending",
        propertyId: prospect.propertyId,
      },
    });

    await tx.messageRecipient.updateMany({
      where: { prospectId: prospect.id },
      data: {
        applicantId: createdApplicant.id,
        prospectId: null,
      },
    });

    await tx.inboundMessage.updateMany({
      where: { prospectId: prospect.id },
      data: {
        applicantId: createdApplicant.id,
        prospectId: null,
      },
    });

    await tx.prospect.update({
      where: { id },
      data: { status: "converted" },
    });

    return createdApplicant;
  });

  return NextResponse.json({ applicant });
}
