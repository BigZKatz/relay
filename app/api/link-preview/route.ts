import { NextRequest, NextResponse } from "next/server";
import { fetchLinkPreview } from "@/lib/link-preview";

export async function GET(req: NextRequest) {
  const url = new URL(req.url).searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const preview = await fetchLinkPreview(url);
  return NextResponse.json(preview);
}
