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

  const updated = await db.applicant.update({
    where: { id },
    data: { status: "future-resident" },
  });

  return NextResponse.json({ applicant: updated });
}
