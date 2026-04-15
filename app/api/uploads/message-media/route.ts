import { NextResponse } from "next/server";
import { persistUpload } from "@/lib/media";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
    }

    if (files.length > 3) {
      return NextResponse.json({ error: "Up to 3 attachments are allowed." }, { status: 400 });
    }

    const uploaded = await Promise.all(files.map((file) => persistUpload(file)));
    return NextResponse.json({ media: uploaded });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json({ error: error.message ?? "Upload failed." }, { status: 400 });
  }
}
