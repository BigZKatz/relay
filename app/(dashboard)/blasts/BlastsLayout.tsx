"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PenSquare, Search, CheckCircle2, XCircle, ChevronDown, Users, ClipboardList, Sparkles } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

function interpolate(template: string, person: { firstName: string; lastName: string; unit: string }): string {
  return template
    .replace(/\{\{firstName\}\}/g, person.firstName)
    .replace(/\{\{lastName\}\}/g, person.lastName)
    .replace(/\{\{fullName\}\}/g, `${person.firstName} ${person.lastName}`)
    .replace(/\{\{unit\}\}/g, person.unit);
}

type Recipient = {
  status: string;
  resident: { firstName: string; lastName: string; unit: string } | null;
  applicant: { firstName: string; lastName: string; unit: string } | null;
};

type Message = {
  id: string;
  body: string;
  mode: string;
  status: string;
  entraLogged: boolean;
  sentAt: string | null;
  createdAt: string;
  property: { name: string } | null;
  recipients: Recipient[];
};

function avatarColor(id: string) {
  const colors = [
    "bg-blue-500", "bg-violet-500", "bg-emerald-500",
    "bg-orange-500", "bg-pink-500", "bg-cyan-500", "bg-amber-500",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function ThreadRow({
  msg,
  active,
  onClick,
}: {
  msg: Message;
  active: boolean;
  onClick: () => void;
}) {
  const delivered = msg.recipients.filter((r) => r.status === "delivered").length;
  const total = msg.recipients.length;
  const isCommunity = msg.mode === "community";
  const preview = msg.body.length > 55 ? msg.body.slice(0, 55) + "…" : msg.body;
  const dateStr = msg.sentAt ?? msg.createdAt;
  const d = new Date(dateStr);
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dateLabel = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 border-b border-slate-100 flex items-start gap-3 transition-colors",
        active ? "bg-blue-600" : "hover:bg-slate-50"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold text-sm mt-0.5",
          isCommunity ? "bg-violet-500" : avatarColor(msg.id)
        )}
      >
        {isCommunity ? <Users className="w-5 h-5" /> : <ClipboardList className="w-4 h-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-sm font-semibold truncate", active ? "text-white" : "text-slate-800")}>
            {isCommunity ? "Community Blast" : "Individual"}
            {msg.property ? ` · ${msg.property.name}` : ""}
          </span>
          <span className={cn("text-xs flex-shrink-0", active ? "text-blue-100" : "text-slate-400")}>
            {dateLabel}
          </span>
        </div>
        <p className={cn("text-xs mt-0.5 truncate", active ? "text-blue-100" : "text-slate-500")}>
          {preview}
        </p>
        <p className={cn("text-xs mt-0.5", active ? "text-blue-200" : "text-slate-400")}>
          {delivered}/{total} delivered
        </p>
      </div>
    </button>
  );
}

function DetailPane({ msg }: { msg: Message }) {
  const [showAll, setShowAll] = useState(false);
  const isCommunity = msg.mode === "community";
  const dateStr = formatDate(msg.sentAt ?? msg.createdAt);
  const delivered = msg.recipients.filter((r) => r.status === "delivered").length;
  const total = msg.recipients.length;

  const visibleRecipients = showAll ? msg.recipients : msg.recipients.slice(0, 8);

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="font-semibold text-slate-800">
            {isCommunity ? "Community Blast" : "Individual Message"}
            {msg.property ? ` — ${msg.property.name}` : ""}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          {msg.entraLogged ? (
            <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span>Entrata logged</span></>
          ) : (
            <><XCircle className="w-3.5 h-3.5 text-slate-300" /><span>Not logged</span></>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {!isCommunity && (
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-600 text-xs px-3 py-1.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              Personalized — each recipient received their own version
            </div>
          </div>
        )}

        {(() => {
          const firstPerson = msg.recipients[0]?.resident ?? msg.recipients[0]?.applicant ?? null;
          const bubbleBody = !isCommunity && firstPerson
            ? interpolate(msg.body, firstPerson)
            : msg.body;
          const previewLabel = !isCommunity && firstPerson
            ? `${firstPerson.firstName} ${firstPerson.lastName} saw:`
            : null;

          return (
            <div className="flex flex-col items-end mb-6">
              {previewLabel && (
                <p className="text-xs text-slate-400 mb-1 mr-1">{previewLabel}</p>
              )}
              <p className="text-xs text-slate-400 mb-1.5">{dateStr}</p>
              <div className="max-w-[75%]">
                <div
                  className={cn(
                    "px-4 py-3 rounded-2xl rounded-tr-sm text-sm text-white leading-relaxed whitespace-pre-wrap shadow-sm",
                    isCommunity ? "bg-violet-600" : "bg-blue-600"
                  )}
                >
                  {bubbleBody}
                </div>
                <div className="flex items-center gap-1 mt-1.5 justify-end">
                  {delivered === total ? (
                    <span className="text-xs text-blue-500">✓✓ {delivered}/{total} delivered</span>
                  ) : (
                    <span className="text-xs text-slate-400">✓ {delivered}/{total} delivered</span>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">
            Recipients ({total})
          </p>
          <div className="space-y-3">
            {visibleRecipients.map((r, i) => {
              const person = r.resident ?? r.applicant;
              const isApplicant = !r.resident && !!r.applicant;
              if (!person) return null;
              const personalizedBody = !isCommunity ? interpolate(msg.body, person) : null;

              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-7 h-7 rounded-full font-semibold text-xs flex items-center justify-center flex-shrink-0 text-white",
                        isApplicant ? "bg-violet-500" : "bg-blue-500"
                      )}>
                        {person.firstName[0]}{person.lastName[0]}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-700">
                          {person.firstName} {person.lastName}
                        </span>
                        <span className="text-xs text-slate-400 font-mono ml-2">{person.unit}</span>
                        {isApplicant && (
                          <span className="text-xs text-violet-500 ml-1.5">applicant</span>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      r.status === "delivered" ? "bg-emerald-100 text-emerald-700" :
                      r.status === "failed" ? "bg-red-100 text-red-700" :
                      "bg-slate-100 text-slate-500"
                    )}>
                      {r.status}
                    </span>
                  </div>
                  {personalizedBody && (
                    <p className="text-xs text-slate-500 pl-9 italic leading-relaxed">
                      &ldquo;{personalizedBody}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {total > 8 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="mt-3 text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
            >
              {showAll ? "Show less" : `Show all ${total} recipients`}
              <ChevronDown className={cn("w-3 h-3 transition-transform", showAll && "rotate-180")} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BlastsLayout({ messages }: { messages: Message[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messageIdFromQuery = searchParams.get("messageId");
  const querySelected =
    messageIdFromQuery && messages.some((m) => m.id === messageIdFromQuery)
      ? messageIdFromQuery
      : null;
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = messages.filter((m) => {
    const matchesSearch =
      !search ||
      m.body.toLowerCase().includes(search.toLowerCase()) ||
      m.property?.name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const selectedMsg = messages.find((m) => m.id === (selected ?? querySelected ?? messages[0]?.id ?? null)) ?? null;

  return (
    <div className="flex overflow-hidden bg-white h-[calc(100vh-56px)] lg:h-screen">
      {/* Left panel */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-slate-200 bg-white">
        <div className="px-4 pt-5 pb-3 border-b border-slate-100">
          <div className="mb-1">
            <h1 className="text-lg font-bold text-slate-900">Blasts</h1>
            <p className="text-xs text-slate-500">Community-wide outbound message history</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/compose")}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors mt-3"
          >
            <PenSquare className="w-4 h-4" />
            New Blast
          </button>
        </div>

        <div className="px-3 py-2.5 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder-slate-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">No blasts found</div>
          ) : (
            filtered.map((msg) => (
              <ThreadRow
                key={msg.id}
                msg={msg}
                active={(selected ?? querySelected ?? messages[0]?.id ?? null) === msg.id}
                onClick={() => setSelected(msg.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {selectedMsg ? (
          <DetailPane msg={selectedMsg} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <PenSquare className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">Select a blast</p>
            <p className="text-slate-400 text-sm mt-1">
              Choose from the list or send a new blast.
            </p>
            <button
              type="button"
              onClick={() => router.push("/compose")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              New Blast
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
