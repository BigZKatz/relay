"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { Search, Send, MessageSquare, Link2, ArrowLeft, Paperclip, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn, relativeTime, formatPhone } from "@/lib/utils";
import { normalizePreviewUrl } from "@/lib/link-preview";

type ParticipantType = "resident" | "applicant" | "future-resident" | "prospect";

type ThreadParticipant = {
  id: string;
  type: ParticipantType;
  firstName: string;
  lastName: string;
  unit: string;
  phone: string;
  propertyId: string;
  propertyName: string;
  lastMessageBody: string | null;
  lastMessageTime: string | null;
  hasUnread: boolean;
};

type ThreadMedia = {
  url: string;
  kind: string;
  mimeType: string | null;
  filename: string | null;
};

type TimelineItem = {
  type: "outbound" | "inbound";
  body: string;
  timestamp: string;
  status?: string;
  twilioSid?: string;
  media?: ThreadMedia[];
};

type QuickLinks = {
  websiteUrl: string | null;
  applyUrl: string | null;
  floorPlansUrl: string | null;
  reviewUrl: string | null;
};

type QuickLinkOption = {
  label: string;
  url: string | null;
  description: string;
};

type LinkPreviewData = {
  url: string;
  title: string;
  description: string;
  image: string | null;
};

type MediaConfig = {
  ready: boolean;
  publicBaseUrl: string | null;
  message: string | null;
};

const QUICK_LINK_OPTIONS = (quickLinks: QuickLinks): QuickLinkOption[] => [
  { label: "Website", url: quickLinks.websiteUrl, description: "Main property website" },
  { label: "Apply Now", url: quickLinks.applyUrl, description: "Online leasing application" },
  { label: "Floor Plans", url: quickLinks.floorPlansUrl, description: "Unit layouts and availability info" },
  { label: "Leave a Review", url: quickLinks.reviewUrl, description: "Review and reputation link" },
];

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function avatarColor(id: string) {
  const colors = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-orange-500", "bg-pink-500", "bg-cyan-500", "bg-amber-500"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function typeLabel(type: ParticipantType) {
  if (type === "future-resident") return "Future Resident";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function extractUrls(body: string) {
  return Array.from(new Set((body.match(/https?:\/\/[^\s]+/g) ?? []).map((url) => normalizePreviewUrl(url))));
}

function isImageMedia(media: ThreadMedia) {
  return media.kind === "image" || media.mimeType?.startsWith("image/") || /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(media.url);
}

function isVideoMedia(media: ThreadMedia) {
  return media.kind === "video" || media.mimeType?.startsWith("video/") || /\.(m4v|mov|mp4|mpeg|mpg|webm)$/i.test(media.url);
}

function isAudioMedia(media: ThreadMedia) {
  return media.kind === "audio" || media.mimeType?.startsWith("audio/") || /\.(aac|m4a|mp3|oga|ogg|wav)$/i.test(media.url);
}

function MediaAttachment({ media, outbound }: { media: ThreadMedia; outbound: boolean }) {
  const sharedClassName = cn(
    "block overflow-hidden rounded-xl border no-underline transition-colors",
    outbound
      ? "border-blue-400/40 bg-blue-500/20 text-blue-50 hover:bg-blue-500/30"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
  );

  if (isImageMedia(media)) {
    return (
      <a href={media.url} target="_blank" rel="noreferrer" className={sharedClassName}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.url} alt={media.filename || "Image attachment"} className="max-h-80 w-full object-cover" />
        <div className="px-3 py-2 text-xs font-medium">🖼️ {media.filename || "Open image"}</div>
      </a>
    );
  }

  if (isVideoMedia(media)) {
    return (
      <div className={sharedClassName}>
        <video controls playsInline preload="metadata" className="max-h-80 w-full bg-black" title={media.filename || "Video attachment"}>
          <source src={media.url} type={media.mimeType || undefined} />
        </video>
        <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs font-medium">
          <span className="truncate">🎥 {media.filename || "Video attachment"}</span>
          <a href={media.url} target="_blank" rel="noreferrer" className={cn("shrink-0 underline", outbound ? "text-blue-100" : "text-blue-600")}>
            Open
          </a>
        </div>
      </div>
    );
  }

  if (isAudioMedia(media)) {
    return (
      <div className={sharedClassName}>
        <div className="px-3 pt-3">
          <audio controls preload="metadata" className="w-full" title={media.filename || "Audio attachment"}>
            <source src={media.url} type={media.mimeType || undefined} />
          </audio>
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs font-medium">
          <span className="truncate">🎵 {media.filename || "Audio attachment"}</span>
          <a href={media.url} target="_blank" rel="noreferrer" className={cn("shrink-0 underline", outbound ? "text-blue-100" : "text-blue-600")}>
            Open
          </a>
        </div>
      </div>
    );
  }

  return (
    <a href={media.url} target="_blank" rel="noreferrer" className={cn(sharedClassName, "px-3 py-2") }>
      <div className="text-xs font-medium">📎 {media.filename || media.url}</div>
      <div className={cn("mt-1 break-all text-[11px]", outbound ? "text-blue-100" : "text-slate-500")}>
        {media.mimeType || "Attachment"}
      </div>
    </a>
  );
}

function LinkPreviewCard({
  url,
  knownLink,
  preview,
  outbound = false,
}: {
  url: string;
  knownLink?: QuickLinkOption | null;
  preview?: LinkPreviewData | null;
  outbound?: boolean;
}) {
  const hostname = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  })();

  return (
    <Link
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "mt-2 block overflow-hidden rounded-xl border no-underline transition-colors",
        outbound
          ? "border-blue-300/40 bg-blue-500/30 text-blue-50 hover:bg-blue-500/40"
          : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
      )}
    >
      {preview?.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview.image} alt={preview.title || knownLink?.label || "Link preview"} className="h-36 w-full object-cover" />
      )}
      <div className="flex items-start gap-3 p-3">
        <div className={cn("mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg", outbound ? "bg-blue-400/30" : "bg-blue-50")}>
          <Link2 className={cn("h-4 w-4", outbound ? "text-blue-50" : "text-blue-600")} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{knownLink?.label || preview?.title || url}</p>
          <p className={cn("mt-0.5 text-xs", outbound ? "text-blue-100" : "text-slate-500")}>
            {preview?.description || knownLink?.description || "Link detected in message"}
          </p>
          {!preview && knownLink && (
            <p className={cn("mt-1 text-[11px] font-medium uppercase tracking-wide", outbound ? "text-blue-200" : "text-slate-400")}>
              Saved property link
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
                outbound ? "bg-blue-400/20 text-blue-100" : "bg-slate-100 text-slate-500"
              )}
            >
              {hostname}
            </span>
            <p className={cn("min-w-0 break-all text-xs underline", outbound ? "text-blue-100" : "text-blue-600")}>{url}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function renderMessageBody(body: string, quickLinks?: QuickLinks, outbound?: boolean, previews?: Record<string, LinkPreviewData>) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = body.split(urlRegex);

  return parts.map((part, index) => {
    const isUrl = /^https?:\/\//.test(part);
    if (!isUrl) return <span key={`${part}-${index}`}>{part}</span>;

    const normalizedUrl = normalizePreviewUrl(part);
    const knownLink = quickLinks ? QUICK_LINK_OPTIONS(quickLinks).find((item) => item.url === normalizedUrl) : null;
    const preview = previews?.[normalizedUrl] ?? null;

    return <LinkPreviewCard key={`${part}-${index}`} url={normalizedUrl} knownLink={knownLink} preview={preview} outbound={outbound} />;
  });
}

function ParticipantRow({ participant, active, onClick }: { participant: ThreadParticipant; active: boolean; onClick: () => void }) {
  const preview = participant.lastMessageBody
    ? participant.lastMessageBody.length > 45
      ? participant.lastMessageBody.slice(0, 45) + "…"
      : participant.lastMessageBody
    : "No messages yet";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 border-b border-slate-100 flex items-start gap-3 transition-colors",
        active
          ? "bg-blue-600"
          : participant.hasUnread
          ? "bg-blue-50/80 hover:bg-blue-100/80"
          : "hover:bg-slate-50"
      )}
    >
      <div className="relative flex-shrink-0 mt-0.5">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm", avatarColor(participant.id))}>
          {initials(participant.firstName, participant.lastName)}
        </div>
        {participant.hasUnread && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full border-2 border-white" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-sm font-semibold truncate", active ? "text-white" : "text-slate-800")}>
            {participant.firstName} {participant.lastName}
          </span>
          <span className={cn("text-xs flex-shrink-0", active ? "text-blue-100" : "text-slate-400")}>
            {participant.lastMessageTime ? relativeTime(participant.lastMessageTime) : ""}
          </span>
        </div>
        <p className={cn("text-xs mt-0.5 truncate", active ? "text-blue-100" : "text-slate-500")}>
          <span className={cn("mr-1.5", active ? "text-blue-200" : "text-slate-400")}>{typeLabel(participant.type)} · {participant.unit}</span>
          {preview}
        </p>
      </div>
    </button>
  );
}

function ThreadPane({ participant, quickLinks, onBack }: { participant: ThreadParticipant; quickLinks: QuickLinks; onBack: () => void }) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [showQuickLinks, setShowQuickLinks] = useState(false);
  const [previews, setPreviews] = useState<Record<string, LinkPreviewData>>({});
  const fetchedUrls = useRef<Set<string>>(new Set());
  const [composerPreviews, setComposerPreviews] = useState<Record<string, LinkPreviewData>>({});
  const [attachments, setAttachments] = useState<ThreadMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [mediaConfig, setMediaConfig] = useState<MediaConfig | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/threads/${participant.type}/${participant.id}`);
      if (res.ok) setTimeline(await res.json());
    } finally {
      setLoading(false);
    }
  }, [participant.id, participant.type]);

  useEffect(() => {
    fetchTimeline();
    setReplyBody("");
    setAttachments([]);
    setComposerPreviews({});
    setSendError(null);
    setShowQuickLinks(false);
  }, [fetchTimeline]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/media-config");
        if (!res.ok) return;
        const data = (await res.json()) as MediaConfig;
        if (!cancelled) setMediaConfig(data);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loading) bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [loading, timeline]);

  useEffect(() => {
    const urls = Array.from(new Set(timeline.flatMap((item) => extractUrls(item.body)))).filter((url) => !fetchedUrls.current.has(url));

    if (urls.length === 0) return;

    // Mark all as requested up front so re-renders don't trigger duplicate fetches
    for (const url of urls) fetchedUrls.current.add(url);

    let cancelled = false;

    (async () => {
      const results = await Promise.all(
        urls.map(async (url) => {
          try {
            const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
            if (!res.ok) return null;
            return (await res.json()) as LinkPreviewData;
          } catch {
            return null;
          }
        })
      );

      if (cancelled) return;

      setPreviews((prev) => {
        const next = { ...prev };
        for (const preview of results) {
          if (preview?.url) next[preview.url] = preview;
        }
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [timeline]);

  useEffect(() => {
    const urls = extractUrls(replyBody);

    if (urls.length === 0) {
      setComposerPreviews({});
      return;
    }

    let cancelled = false;

    (async () => {
      const results = await Promise.all(
        urls.map(async (url) => {
          if (previews[url]) return previews[url];
          try {
            const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
            if (!res.ok) return null;
            return (await res.json()) as LinkPreviewData;
          } catch {
            return null;
          }
        })
      );

      if (cancelled) return;

      const next: Record<string, LinkPreviewData> = {};
      for (const preview of results) {
        if (preview?.url) next[preview.url] = preview;
      }
      setComposerPreviews(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [replyBody, previews]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0 || attachments.length >= 3) return;

    setUploading(true);
    setSendError(null);
    try {
      const formData = new FormData();
      files.slice(0, 3 - attachments.length).forEach((file) => formData.append("files", file));

      const res = await fetch("/api/uploads/message-media", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");

      setAttachments((prev) => [...prev, ...(data.media as ThreadMedia[])]);
    } catch (err) {
      const error = err as { message?: string };
      setSendError(error.message ?? "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if ((!replyBody.trim() && attachments.length === 0) || sending || uploading) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/reply/${participant.type}/${participant.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody.trim(), media: attachments }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSendError(data?.error ?? "Send failed.");
        return;
      }
      setReplyBody("");
      setAttachments([]);
      setComposerPreviews({});
      await fetchTimeline();
    } finally {
      setSending(false);
    }
  };

  const quickLinkOptions = QUICK_LINK_OPTIONS(quickLinks).filter((item): item is QuickLinkOption & { url: string } => Boolean(item.url));

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-slate-200 px-4 pb-4 pt-16 lg:px-6 lg:py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0", avatarColor(participant.id))}>
            {initials(participant.firstName, participant.lastName)}
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">{participant.firstName} {participant.lastName}</h2>
            <p className="text-xs text-slate-400">{typeLabel(participant.type)} · {participant.unit} · {formatPhone(participant.phone)}</p>
            <p className="mt-0.5 text-xs text-slate-400">{participant.propertyName}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : timeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3"><MessageSquare className="w-5 h-5 text-slate-400" /></div>
            <p className="text-slate-500 text-sm font-medium">No messages yet</p>
            <p className="text-slate-400 text-xs mt-1">Send a reply below to start the conversation.</p>
          </div>
        ) : (
          timeline.map((item, i) => (
            <div key={i} className={cn("flex", item.type === "outbound" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[70%] space-y-1", item.type === "outbound" ? "items-end" : "items-start", "flex flex-col")}>
                <div className={cn("px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap", item.type === "outbound" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-slate-100 text-slate-800 rounded-tl-sm")}>
                  {renderMessageBody(item.body, quickLinks, item.type === "outbound", previews)}
                  {item.media && item.media.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {item.media.map((media, mediaIndex) => (
                        <MediaAttachment
                          key={`${media.url}-${mediaIndex}`}
                          media={media}
                          outbound={item.type === "outbound"}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className={cn("flex items-center gap-1.5 text-xs", item.type === "outbound" ? "justify-end" : "justify-start")}>
                  <span className="text-slate-400">{relativeTime(item.timestamp)}</span>
                  {item.type === "outbound" && item.status && <span className={cn("font-medium", item.status === "delivered" ? "text-blue-500" : item.status === "failed" ? "text-red-400" : "text-slate-400")}>· {item.status}</span>}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-slate-200 flex-shrink-0">
        {showQuickLinks && (
          <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-2 space-y-1">
            <div className="px-2 py-1">
              <p className="text-xs font-medium text-slate-600">Saved links for {participant.propertyName}</p>
            </div>
            {quickLinkOptions.length > 0 ? quickLinkOptions.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setReplyBody((prev) => [prev.trim(), item.url].filter(Boolean).join(prev.trim() ? "\n" : ""));
                  setShowQuickLinks(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-white hover:border-slate-200 border border-transparent transition-colors"
              >
                <span className="font-medium">{item.label}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{item.description}</span>
                <span className="mt-1 block text-xs text-slate-400 truncate">{item.url}</span>
              </button>
            )) : (
              <div className="px-3 py-3 text-xs text-slate-500">
                No property quick links saved yet for this thread.
              </div>
            )}
          </div>
        )}
        {attachments.length > 0 && (
          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {attachments.map((item) => (
              <div key={item.url} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-2">
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((media) => media.url !== item.url))}
                  className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-700"
                  title="Remove attachment"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <MediaAttachment media={item} outbound={false} />
                <div className="mt-2 px-1 text-[11px] text-slate-500">
                  {item.mimeType || item.kind}
                </div>
              </div>
            ))}
          </div>
        )}
        {attachments.length > 0 && mediaConfig && !mediaConfig.ready && (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <p className="font-medium">Attachments render here, but outbound MMS is not ready yet.</p>
            <p className="mt-1">{mediaConfig.message}</p>
          </div>
        )}
        {sendError && <p className="mb-3 text-xs text-red-500">{sendError}</p>}
        {extractUrls(replyBody).length > 0 && (
          <div className="mb-3 space-y-2">
            {extractUrls(replyBody).map((url) => {
              const knownLink = quickLinkOptions.find((item) => item.url === url) ?? null;
              return <LinkPreviewCard key={url} url={url} knownLink={knownLink} preview={composerPreviews[url] ?? null} />;
            })}
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            type="button"
            aria-label="Quick links"
            onClick={() => setShowQuickLinks((prev) => !prev)}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex-shrink-0"
            title="Quick links"
          >
            <Link2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Attach media"
            onClick={() => fileInputRef.current?.click()}
            disabled={attachments.length >= 3 || uploading || sending}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors flex-shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
            title="Attach media"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,application/pdf"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder={uploading ? "Uploading…" : "Type a reply…"}
            rows={2}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            type="button"
            aria-label="Send reply"
            onClick={handleSend}
            disabled={(!replyBody.trim() && attachments.length === 0) || sending || uploading}
            className={cn("flex items-center justify-center w-10 h-10 rounded-xl transition-colors flex-shrink-0", (replyBody.trim() || attachments.length > 0) && !sending && !uploading ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-200 text-slate-400 cursor-not-allowed")}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ThreadsLayout({ participants, quickLinksByPropertyId }: { participants: ThreadParticipant[]; quickLinksByPropertyId: Record<string, QuickLinks> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const participantIdFromQuery = searchParams.get("participantId");
  const participantTypeFromQuery = searchParams.get("participantType") as ParticipantType | null;
  const residentIdFromQuery = searchParams.get("residentId");

  const explicitQuerySelected = useMemo(() => {
    if (participantIdFromQuery && participantTypeFromQuery) {
      const match = participants.find((p) => p.id === participantIdFromQuery && p.type === participantTypeFromQuery);
      if (match) return `${match.type}:${match.id}`;
    }
    if (residentIdFromQuery) {
      const match = participants.find((p) => p.id === residentIdFromQuery && p.type === "resident");
      if (match) return `${match.type}:${match.id}`;
    }
    return null;
  }, [participantIdFromQuery, participantTypeFromQuery, residentIdFromQuery, participants]);

  const [manualSelected, setManualSelected] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileThread, setShowMobileThread] = useState(Boolean(explicitQuerySelected));
  const [search, setSearch] = useState("");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const syncViewport = () => {
      const mobile = mediaQuery.matches;
      setIsMobile(mobile);
      if (!mobile) setShowMobileThread(true);
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  const filtered = participants.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.unit.toLowerCase().includes(q) ||
      p.propertyName.toLowerCase().includes(q) ||
      typeLabel(p.type).toLowerCase().includes(q)
    );
  });

  const filteredKeys = useMemo(() => new Set(filtered.map((p) => `${p.type}:${p.id}`)), [filtered]);

  const selected = (() => {
    if (manualSelected && filteredKeys.has(manualSelected)) return manualSelected;
    if (explicitQuerySelected && filteredKeys.has(explicitQuerySelected)) return explicitQuerySelected;
    if (isMobile) return null;
    return filtered[0] ? `${filtered[0].type}:${filtered[0].id}` : null;
  })();

  const selectedParticipant = selected
    ? filtered.find((p) => `${p.type}:${p.id}` === selected) ?? null
    : null;
  const mobileShowingThread = isMobile ? Boolean(showMobileThread && selectedParticipant) : false;

  useEffect(() => {
    if (!isMobile || !explicitQuerySelected) return;
    setShowMobileThread(true);
  }, [explicitQuerySelected, isMobile]);
  const selectedQuickLinks = selectedParticipant ? quickLinksByPropertyId[selectedParticipant.propertyId] : null;

  useEffect(() => {
    if (!selectedParticipant) return;

    const params = new URLSearchParams(searchParams.toString());
    const currentId = params.get("participantId");
    const currentType = params.get("participantType");

    if (currentId === selectedParticipant.id && currentType === selectedParticipant.type) return;

    params.set("participantId", selectedParticipant.id);
    params.set("participantType", selectedParticipant.type);
    params.delete("residentId");

    const nextUrl = `${pathname}?${params.toString()}`;
    router.replace(nextUrl, { scroll: false });
  }, [isMobile, pathname, router, searchParams, selectedParticipant]);

  return (
    <div className="flex overflow-hidden bg-white h-[calc(100vh-56px)] lg:h-screen">
      <div className={cn("w-full lg:w-72 flex-shrink-0 flex-col border-r border-slate-200 bg-white", mobileShowingThread ? "hidden lg:flex" : "flex")}>
        <div className="px-4 pt-5 pb-3 border-b border-slate-100">
          <h1 className="text-lg font-bold text-slate-900">Threads</h1>
          <p className="text-xs text-slate-500 mt-0.5">Conversations across the full pipeline</p>
        </div>

        <div className="px-3 py-2.5 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, stage, unit, or property…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder-slate-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">{search ? "No conversations match your search" : "No message activity yet"}</div>
          ) : (
            filtered.map((p) => (
              <ParticipantRow
                key={`${p.type}:${p.id}`}
                participant={p}
                active={selectedParticipant ? `${p.type}:${p.id}` === `${selectedParticipant.type}:${selectedParticipant.id}` : false}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("participantId", p.id);
                  params.set("participantType", p.type);
                  params.delete("residentId");
                  setManualSelected(`${p.type}:${p.id}`);
                  router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                  setShowMobileThread(true);
                }}
              />
            ))
          )}
        </div>
      </div>

      <div className={cn("flex-1 flex-col overflow-hidden bg-white", selectedParticipant && (!isMobile || showMobileThread) ? "flex" : "hidden lg:flex")}>
        {selectedParticipant ? (
          <ThreadPane
            participant={selectedParticipant}
            quickLinks={selectedQuickLinks ?? { websiteUrl: null, applyUrl: null, floorPlansUrl: null, reviewUrl: null }}
            onBack={() => {
              if (isMobile) {
                setShowMobileThread(false);
                setManualSelected(null);
              }
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4"><MessageSquare className="w-7 h-7 text-slate-400" /></div>
            <p className="text-slate-600 font-medium">Select a conversation</p>
            <p className="text-slate-400 text-sm mt-1">Choose a thread from the list to view and reply.</p>
          </div>
        )}
      </div>
    </div>
  );
}
