"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, ChevronDown } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Recipient = {
  status: string;
  resident: {
    firstName: string;
    lastName: string;
    unit: string;
  } | null;
  applicant?: {
    firstName: string;
    lastName: string;
    unit: string;
  } | null;
};

type Message = {
  id: string;
  body: string;
  mode: string;
  status: string;
  entraLogged: boolean;
  sentAt: Date | null;
  createdAt: Date;
  property: { name: string } | null;
  recipients: Recipient[];
};

function DeliveryDots({ recipients }: { recipients: Recipient[] }) {
  const delivered = recipients.filter((r) => r.status === "delivered").length;
  const total = recipients.length;
  const allDelivered = delivered === total;
  const noneFailed = recipients.every((r) => r.status !== "failed");

  return (
    <div className="flex items-center gap-1 mt-1 justify-end">
      {allDelivered ? (
        <span className="text-xs text-blue-400">✓✓ {delivered}/{total} delivered</span>
      ) : noneFailed ? (
        <span className="text-xs text-slate-400">✓ {delivered}/{total} delivered</span>
      ) : (
        <span className="text-xs text-red-400">{delivered}/{total} delivered</span>
      )}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const [expanded, setExpanded] = useState(false);
  const sentDate = msg.sentAt ? formatDate(msg.sentAt) : formatDate(msg.createdAt);
  const isCommunity = msg.mode === "community";

  return (
    <div className="flex flex-col items-end">
      {/* Timestamp */}
      <p className="text-xs text-slate-400 mb-1 mr-1">{sentDate}</p>

      {/* Bubble */}
      <div className="max-w-[80%] lg:max-w-[60%]">
        <div
          className={cn(
            "px-4 py-3 rounded-2xl rounded-tr-sm text-sm text-white leading-relaxed whitespace-pre-wrap shadow-sm",
            isCommunity ? "bg-violet-600" : "bg-blue-600"
          )}
        >
          {msg.body}
        </div>

        {/* Delivery status */}
        <DeliveryDots recipients={msg.recipients} />

        {/* Expand for details */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-xs text-slate-400 mt-1.5 ml-auto cursor-pointer touch-manipulation"
        >
          {expanded ? "Hide details" : "Details"}
          <ChevronDown className={cn("w-3 h-3 transition-transform", expanded && "rotate-180")} />
        </button>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="w-full max-w-[80%] lg:max-w-[60%] mt-2 bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          {/* Recipients */}
          {msg.recipients.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Recipients</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {msg.recipients.map((r, i) => {
                  const person = r.resident ?? r.applicant;
                  const isApplicant = !r.resident && !!r.applicant;
                  if (!person) return null;
                  return (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-7 h-7 rounded-full font-semibold text-xs flex items-center justify-center flex-shrink-0",
                          isApplicant ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {person.firstName[0]}{person.lastName[0]}
                        </div>
                        <div>
                          <span className="text-xs font-medium text-slate-700">
                            {person.firstName} {person.lastName}
                          </span>
                          <span className="text-xs text-slate-400 font-mono ml-1.5">{person.unit}</span>
                          {isApplicant && <span className="text-xs text-violet-500 ml-1">applicant</span>}
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
                  );
                })}
              </div>
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500 flex-wrap">
            <span className={cn("font-medium capitalize", isCommunity ? "text-violet-600" : "text-blue-600")}>
              {msg.mode}
            </span>
            {msg.property && <span>{msg.property.name}</span>}
            <div className="flex items-center gap-1">
              {msg.entraLogged ? (
                <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span>Entrata logged</span></>
              ) : (
                <><XCircle className="w-3.5 h-3.5 text-slate-300" /><span>Entrata pending</span></>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessageList({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <p className="text-slate-500 font-medium">No messages yet</p>
        <p className="text-slate-400 text-sm mt-1">Head to Compose to send your first message.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} msg={msg} />
      ))}
    </div>
  );
}
