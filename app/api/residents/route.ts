import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get("propertyId");

  const residents = await db.resident.findMany({
    where: {
      status: "active",
      ...(propertyId ? { propertyId } : {}),
    },
    include: { property: { select: { name: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return NextResponse.json({ residents });
}
