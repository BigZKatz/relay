import { NextResponse } from "next/server";
import { getMediaConfigStatus } from "@/lib/media";

export async function GET() {
  return NextResponse.json(getMediaConfigStatus());
}
