import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { randomUUID } from "crypto";

export type UploadedMedia = {
  url: string;
  kind: string;
  mimeType: string | null;
  filename: string | null;
};

export type MediaConfigStatus = {
  ready: boolean;
  publicBaseUrl: string | null;
  message: string | null;
};

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "application/pdf",
]);

function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function parsePublicAppUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { valid: false, url: null, message: "Public app URL is invalid." } as const;
  }

  const host = url.hostname.toLowerCase();
  const isPrivateHost =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);

  if (url.protocol !== "https:" || isPrivateHost) {
    return {
      valid: false,
      url,
      message:
        "Outbound MMS requires PUBLIC_APP_URL or NEXT_PUBLIC_APP_URL to be a public HTTPS URL reachable by Twilio. Localhost and private network URLs will not work.",
    } as const;
  }

  return { valid: true, url, message: null } as const;
}

export function getMediaConfigStatus(): MediaConfigStatus {
  const raw = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";

  if (!raw) {
    return {
      ready: false,
      publicBaseUrl: null,
      message:
        "Set PUBLIC_APP_URL or NEXT_PUBLIC_APP_URL to a public HTTPS URL so Twilio can fetch uploaded media for MMS.",
    };
  }

  const parsed = parsePublicAppUrl(raw);
  return {
    ready: parsed.valid,
    publicBaseUrl: parsed.url?.origin ?? null,
    message: parsed.message,
  };
}

export function getPublicAppUrl() {
  const config = getMediaConfigStatus();

  if (!config.ready || !config.publicBaseUrl) {
    throw new Error(
      config.message ??
        "PUBLIC_APP_URL or NEXT_PUBLIC_APP_URL must be set to a public HTTPS URL for media sending."
    );
  }

  return config.publicBaseUrl;
}

export function canSendMediaUrls(mediaUrls?: string[]) {
  if (!mediaUrls?.length) {
    return { ok: true as const, message: null };
  }

  const config = getMediaConfigStatus();
  if (!config.ready) {
    return {
      ok: false as const,
      message:
        config.message ??
        "Outbound MMS is blocked until a public HTTPS app URL is configured.",
    };
  }

  const invalidUrl = mediaUrls.find((url) => !/^https:\/\//i.test(url));
  if (invalidUrl) {
    return {
      ok: false as const,
      message: "Outbound MMS attachments must resolve to public HTTPS URLs.",
    };
  }

  return { ok: true as const, message: null };
}

export function validateUpload(file: File) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Unsupported file type. Allowed: JPG, PNG, GIF, WebP, MP4, MOV, PDF.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File too large. Max size is 5 MB.");
  }
}

export async function persistUpload(file: File): Promise<UploadedMedia> {
  validateUpload(file);

  const config = getMediaConfigStatus();
  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = sanitizeFilename(file.name || "upload");
  const storedFilename = `${randomUUID()}-${safeName}`;
  const relativeDir = path.join("public", "uploads", "message-media");
  const absoluteDir = path.join(process.cwd(), relativeDir);
  const absolutePath = path.join(absoluteDir, storedFilename);
  const relativeUrl = `/uploads/message-media/${storedFilename}`;

  await mkdir(absoluteDir, { recursive: true });
  await writeFile(absolutePath, bytes);

  return {
    url: config.publicBaseUrl ? `${config.publicBaseUrl}${relativeUrl}` : relativeUrl,
    kind: file.type.startsWith("video/") ? "video" : file.type === "application/pdf" ? "document" : "image",
    mimeType: file.type || null,
    filename: file.name || null,
  };
}
