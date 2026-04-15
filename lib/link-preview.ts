export type LinkPreview = {
  url: string;
  title: string;
  description: string;
  image: string | null;
};

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function extractTitle(html: string) {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : null;
}

function extractMeta(html: string, key: string, attr: "property" | "name" | "itemprop" = "property") {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of metaTags) {
    const attrRegex = /([a-zA-Z:-]+)\s*=\s*(["'])(.*?)\2/gi;
    const attributes: Record<string, string> = {};

    for (const match of tag.matchAll(attrRegex)) {
      attributes[match[1].toLowerCase()] = match[3];
    }

    if (attributes[attr] !== key || !attributes.content) continue;
    return decodeHtmlEntities(attributes.content.trim());
  }

  return null;
}

function collectStructuredDataImages(html: string) {
  const scriptMatches = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  const images: string[] = [];
  const seen = new Set<string>();

  const addImage = (value: unknown) => {
    if (typeof value === "string") {
      const trimmed = decodeHtmlEntities(value.trim());
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        images.push(trimmed);
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(addImage);
      return;
    }

    if (!value || typeof value !== "object") return;

    const record = value as Record<string, unknown>;
    addImage(record.url);
    addImage(record.contentUrl);
    addImage(record.image);
    addImage(record.logo);
    addImage(record.thumbnailUrl);
    addImage(record.primaryImageOfPage);
  };

  const visitNode = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visitNode);
      return;
    }

    if (!value || typeof value !== "object") return;

    const record = value as Record<string, unknown>;
    addImage(record.image);
    addImage(record.logo);
    addImage(record.thumbnailUrl);
    addImage(record.primaryImageOfPage);

    Object.values(record).forEach((child) => {
      if (child && typeof child === "object") visitNode(child);
    });
  };

  for (const script of scriptMatches) {
    const contentMatch = script.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
    const content = contentMatch?.[1]?.trim();
    if (!content) continue;

    try {
      visitNode(JSON.parse(content));
    } catch {
      // ignore invalid structured data blocks
    }
  }

  return images;
}

function extractImageCandidates(html: string) {
  const candidates = [
    extractMeta(html, "og:image"),
    extractMeta(html, "og:image:url"),
    extractMeta(html, "og:image:secure_url"),
    extractMeta(html, "twitter:image", "name"),
    extractMeta(html, "twitter:image:src", "name"),
    extractMeta(html, "image", "itemprop"),
    ...collectStructuredDataImages(html),
  ];

  const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
  for (const tag of imgTags) {
    const srcMatch = tag.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);
    if (srcMatch?.[2]) candidates.push(decodeHtmlEntities(srcMatch[2].trim()));
  }

  return candidates;
}

export function normalizePreviewUrl(value: string) {
  return value.trim().replace(/[),.;!?]+$/, "");
}

function toAbsoluteUrl(baseUrl: string, value: string | null) {
  if (!value) return null;
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function normalizeImageUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  const normalizedUrl = normalizePreviewUrl(url);

  try {
    const parsedUrl = new URL(normalizedUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("Unsupported protocol");

    const res = await fetch(parsedUrl, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
    const html = await res.text();

    // Use the final URL after redirects as the base for resolving relative image paths
    const baseUrl = res.url || normalizedUrl;

    const title = extractMeta(html, "og:title") || extractMeta(html, "twitter:title", "name") || extractTitle(html) || normalizedUrl;
    const description =
      extractMeta(html, "og:description") ||
      extractMeta(html, "twitter:description", "name") ||
      extractMeta(html, "description", "name") ||
      "Open link";
    const image =
      extractImageCandidates(html)
        .map((candidate) => normalizeImageUrl(toAbsoluteUrl(baseUrl, candidate)))
        .find((candidate): candidate is string => Boolean(candidate)) ?? null;

    return { url: normalizedUrl, title, description, image };
  } catch {
    return {
      url: normalizedUrl,
      title: normalizedUrl,
      description: "Open link",
      image: null,
    };
  }
}
