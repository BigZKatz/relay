"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Search,
  X,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Person = {
  id: string;
  firstName: string;
  lastName: string;
  unit: string;
  phone: string;
};

type Resident = Person;

type Applicant = Person & {
  status: string;
};

type Prospect = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  unitInterest?: string | null;
  status: string;
};

type Property = {
  id: string;
  name: string;
  address: string;
  residents: Resident[];
};

type Template = {
  id: string;
  name: string;
  body: string;
  category: string;
};

type RecipientScope = "all" | "property" | "individual" | "applicant-individual" | "prospect-individual" | "future-resident-individual";

interface Props {
  properties: Property[];
  templates: Template[];
  applicants: Applicant[];
  prospects: Prospect[];
  futureResidents: Applicant[];
}

const SMS_LIMIT = 160;

const recipientTabs: { value: RecipientScope; label: string; countMode?: "allResidents" }[] = [
  { value: "individual", label: "Residents" },
  { value: "future-resident-individual", label: "Future Residents" },
  { value: "applicant-individual", label: "Applicants" },
  { value: "prospect-individual", label: "Prospects" },
  { value: "all", label: "All Residents", countMode: "allResidents" },
  { value: "property", label: "By Property" },
];

export default function ComposeForm({ properties, templates, applicants, prospects, futureResidents }: Props) {
  const router = useRouter();
  const [scope, setScope] = useState<RecipientScope>("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [selectedResidentIds, setSelectedResidentIds] = useState<string[]>([]);
  const [selectedApplicantIds, setSelectedApplicantIds] = useState<string[]>([]);
  const [selectedProspectIds, setSelectedProspectIds] = useState<string[]>([]);
  const [selectedFutureResidentIds, setSelectedFutureResidentIds] = useState<string[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [residentSearch, setResidentSearch] = useState("");
  const [applicantSearch, setApplicantSearch] = useState("");
  const [prospectSearch, setProspectSearch] = useState("");
  const [futureResidentSearch, setFutureResidentSearch] = useState("");

  const BLAST_PREFIX = "Attention Residents, ";

  const allResidents = properties.flatMap((p) => p.residents);

  const isDmMode =
    (scope === "individual" && selectedResidentIds.length === 1) ||
    (scope === "applicant-individual" && selectedApplicantIds.length === 1) ||
    (scope === "prospect-individual" && selectedProspectIds.length === 1) ||
    (scope === "future-resident-individual" && selectedFutureResidentIds.length === 1);

  const prevIsDmMode = useRef(isDmMode);

  useEffect(() => {
    if (prevIsDmMode.current === isDmMode) return;

    setBody((prev) => {
      const trimmed = prev.trim();

      if (isDmMode) {
        if (!trimmed || trimmed === BLAST_PREFIX.trim()) return "";
        return prev.startsWith(BLAST_PREFIX) ? prev.slice(BLAST_PREFIX.length) : prev;
      }

      if (!trimmed) return "";
      return prev;
    });

    prevIsDmMode.current = isDmMode;
  }, [isDmMode]);

  const getRecipients = useCallback((): { residents: Resident[]; applicants: Applicant[]; prospects: Prospect[]; futureResidentApplicants: Applicant[] } => {
    if (scope === "all") return { residents: allResidents, applicants: [], prospects: [], futureResidentApplicants: [] };
    if (scope === "property" && selectedPropertyId) {
      const propResidents = properties.find((p) => p.id === selectedPropertyId)?.residents ?? [];
      return { residents: propResidents, applicants: [], prospects: [], futureResidentApplicants: [] };
    }
    if (scope === "individual") {
      return { residents: allResidents.filter((r) => selectedResidentIds.includes(r.id)), applicants: [], prospects: [], futureResidentApplicants: [] };
    }
    if (scope === "applicant-individual") {
      return { residents: [], applicants: applicants.filter((a) => selectedApplicantIds.includes(a.id)), prospects: [], futureResidentApplicants: [] };
    }
    if (scope === "prospect-individual") {
      return { residents: [], applicants: [], prospects: prospects.filter((p) => selectedProspectIds.includes(p.id)), futureResidentApplicants: [] };
    }
    if (scope === "future-resident-individual") {
      return { residents: [], applicants: [], prospects: [], futureResidentApplicants: futureResidents.filter((fr) => selectedFutureResidentIds.includes(fr.id)) };
    }
    return { residents: [], applicants: [], prospects: [], futureResidentApplicants: [] };
  }, [scope, selectedPropertyId, selectedResidentIds, selectedApplicantIds, selectedProspectIds, selectedFutureResidentIds, allResidents, properties, applicants, prospects, futureResidents]);

  const { residents: recipientResidents, applicants: recipientApplicants, prospects: recipientProspects, futureResidentApplicants: recipientFutureResidents } = getRecipients();
  const allRecipients: Person[] = [
    ...recipientResidents,
    ...recipientApplicants,
    ...recipientProspects.map((p) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, unit: p.unitInterest ?? "", phone: p.phone })),
    ...recipientFutureResidents,
  ];
  const charCount = body.length;
  const segments = Math.ceil(charCount / SMS_LIMIT) || 1;

  const handleSend = async () => {
    if (!body.trim() || allRecipients.length === 0) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          mode: isDmMode ? "personalized" : "community",
          recipientIds: recipientResidents.map((r) => r.id),
          applicantIds: [...recipientApplicants.map((a) => a.id), ...recipientFutureResidents.map((fr) => fr.id)],
          prospectIds: recipientProspects.map((p) => p.id),
          propertyId: selectedPropertyId || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({
          success: true,
          message: `Message sent to ${data.sent} recipient${data.sent !== 1 ? "s" : ""}.`,
        });
        setBody("");
        setTimeout(() => router.refresh(), 1500);
      } else {
        setResult({ success: false, message: data.error ?? "Send failed." });
      }
    } catch {
      setResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="px-4 py-5 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Compose</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Send a message to prospects, applicants, future residents, or residents via Twilio SMS
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-4">

          {/* Recipients */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-medium text-slate-700 mb-3">Recipients</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {recipientTabs.map(({ value, label, countMode }) => {
                const buttonLabel = countMode === "allResidents"
                  ? `${label} (${allResidents.length})`
                  : label;

                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={scope === value}
                    data-active={scope === value ? "true" : "false"}
                    onClick={() => {
                      setScope(value);
                      setResult(null);
                    }}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] cursor-pointer touch-manipulation text-left border select-none",
                      scope === value
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 active:bg-slate-300"
                    )}
                  >
                    {buttonLabel}
                  </button>
                );
              })}
            </div>

            {scope === "property" && (
              <div className="relative">
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-3 text-sm text-slate-700 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a property...</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.residents.length} residents)
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            )}

            {scope === "individual" && (
              <div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search residents..."
                    value={residentSearch}
                    onChange={(e) => setResidentSearch(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder-slate-400"
                  />
                  {residentSearch && (
                    <button
                      type="button"
                      onClick={() => setResidentSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {allResidents.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">No residents found</p>
                  ) : (() => {
                    const filtered = residentSearch
                      ? allResidents.filter((r) =>
                          `${r.firstName} ${r.lastName} ${r.unit}`.toLowerCase().includes(residentSearch.toLowerCase())
                        )
                      : allResidents;
                    return filtered.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">No matches for &ldquo;{residentSearch}&rdquo;</p>
                    ) : filtered.map((r) => (
                      <label
                        key={r.id}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 cursor-pointer min-h-[48px]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedResidentIds.includes(r.id)}
                          onChange={(e) =>
                            setSelectedResidentIds((prev) =>
                              e.target.checked ? [...prev, r.id] : prev.filter((id) => id !== r.id)
                            )
                          }
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                            {r.firstName[0]}{r.lastName[0]}
                          </div>
                          <span className="text-sm text-slate-700">
                            {r.firstName} {r.lastName}
                          </span>
                          <span className="text-xs text-slate-400 font-mono ml-auto">{r.unit}</span>
                        </div>
                      </label>
                    ));
                  })()}
                </div>
              </div>
            )}

            {scope === "applicant-individual" && (
              <div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search applicants..."
                    value={applicantSearch}
                    onChange={(e) => setApplicantSearch(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-700 placeholder-slate-400"
                  />
                  {applicantSearch && (
                    <button
                      type="button"
                      onClick={() => setApplicantSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {applicants.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">No applicants found</p>
                  ) : (() => {
                    const filtered = applicantSearch
                      ? applicants.filter((a) =>
                          `${a.firstName} ${a.lastName} ${a.unit}`.toLowerCase().includes(applicantSearch.toLowerCase())
                        )
                      : applicants;
                    return filtered.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">No matches for &ldquo;{applicantSearch}&rdquo;</p>
                    ) : filtered.map((a) => (
                      <label
                        key={a.id}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 cursor-pointer min-h-[48px]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedApplicantIds.includes(a.id)}
                          onChange={(e) =>
                            setSelectedApplicantIds((prev) =>
                              e.target.checked ? [...prev, a.id] : prev.filter((id) => id !== a.id)
                            )
                          }
                          className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                            {a.firstName[0]}{a.lastName[0]}
                          </div>
                          <span className="text-sm text-slate-700">
                            {a.firstName} {a.lastName}
                          </span>
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0",
                            a.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                            a.status === "denied" ? "bg-red-100 text-red-700" :
                            a.status === "waitlist" ? "bg-blue-100 text-blue-700" :
                            "bg-amber-100 text-amber-700"
                          )}>
                            {a.status}
                          </span>
                          <span className="text-xs text-slate-400 font-mono ml-auto">{a.unit}</span>
                        </div>
                      </label>
                    ));
                  })()}
                </div>
              </div>
            )}

            {scope === "prospect-individual" && (
              <div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search prospects..."
                    value={prospectSearch}
                    onChange={(e) => setProspectSearch(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700 placeholder-slate-400"
                  />
                  {prospectSearch && (
                    <button
                      type="button"
                      onClick={() => setProspectSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {prospects.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">No prospects found</p>
                  ) : (() => {
                    const filtered = prospectSearch
                      ? prospects.filter((p) =>
                          `${p.firstName} ${p.lastName} ${p.unitInterest ?? ""}`.toLowerCase().includes(prospectSearch.toLowerCase())
                        )
                      : prospects;
                    return filtered.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">No matches for &ldquo;{prospectSearch}&rdquo;</p>
                    ) : filtered.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 cursor-pointer min-h-[48px]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProspectIds.includes(p.id)}
                          onChange={(e) =>
                            setSelectedProspectIds((prev) =>
                              e.target.checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)
                            )
                          }
                          className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                            {p.firstName[0]}{p.lastName[0]}
                          </div>
                          <span className="text-sm text-slate-700">
                            {p.firstName} {p.lastName}
                          </span>
                          {p.unitInterest && (
                            <span className="text-xs text-slate-400 font-mono ml-auto">{p.unitInterest}</span>
                          )}
                        </div>
                      </label>
                    ));
                  })()}
                </div>
              </div>
            )}

            {scope === "future-resident-individual" && (
              <div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search future residents..."
                    value={futureResidentSearch}
                    onChange={(e) => setFutureResidentSearch(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 placeholder-slate-400"
                  />
                  {futureResidentSearch && (
                    <button
                      type="button"
                      onClick={() => setFutureResidentSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {futureResidents.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">No future residents found</p>
                  ) : (() => {
                    const filtered = futureResidentSearch
                      ? futureResidents.filter((fr) =>
                          `${fr.firstName} ${fr.lastName} ${fr.unit}`.toLowerCase().includes(futureResidentSearch.toLowerCase())
                        )
                      : futureResidents;
                    return filtered.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4">No matches for &ldquo;{futureResidentSearch}&rdquo;</p>
                    ) : filtered.map((fr) => (
                      <label
                        key={fr.id}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 cursor-pointer min-h-[48px]"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFutureResidentIds.includes(fr.id)}
                          onChange={(e) =>
                            setSelectedFutureResidentIds((prev) =>
                              e.target.checked ? [...prev, fr.id] : prev.filter((id) => id !== fr.id)
                            )
                          }
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                            {fr.firstName[0]}{fr.lastName[0]}
                          </div>
                          <span className="text-sm text-slate-700">
                            {fr.firstName} {fr.lastName}
                          </span>
                          <span className="text-xs text-slate-400 font-mono ml-auto">{fr.unit}</span>
                        </div>
                      </label>
                    ));
                  })()}
                </div>
              </div>
            )}

            {allRecipients.length > 0 && (
              <p className="text-xs text-slate-500 mt-3">
                {allRecipients.length} recipient{allRecipients.length !== 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Message Body */}
          <div className={cn(
            "bg-white rounded-xl border p-4 transition-colors",
            isDmMode ? "border-blue-300" : "border-slate-200"
          )}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-700">Message</p>
                {isDmMode && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                    <MessageSquare className="w-3 h-3" />
                    Direct Message
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowTemplates((v) => !v)}
                className="flex items-center gap-1.5 text-sm text-blue-600 py-1 px-2 rounded-lg"
              >
                <Sparkles className="w-4 h-4" />
                Templates
              </button>
            </div>

            {showTemplates && templates.length > 0 && (
              <div className="mb-3 space-y-1 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setBody(t.body);
                      setShowTemplates(false);
                    }}
                    className="w-full text-left px-3 py-3 rounded-lg hover:bg-slate-50 transition-colors min-h-[52px]"
                  >
                    <p className="text-sm font-medium text-slate-700">{t.name}</p>
                    <p className="text-xs text-slate-400 truncate">{t.body}</p>
                  </button>
                ))}
              </div>
            )}

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={isDmMode ? "Type a direct message..." : "Type a community update..."}
              rows={6}
              className={cn(
                "w-full bg-slate-50 border rounded-lg px-3 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 resize-none",
                isDmMode
                  ? "border-blue-200 focus:ring-blue-400"
                  : "border-slate-200 focus:ring-blue-500"
              )}
            />

            <div className="flex items-center justify-between mt-2">
              <span className={cn("text-xs", charCount > SMS_LIMIT ? "text-amber-600" : "text-slate-400")}>
                {charCount}/{SMS_LIMIT} · {segments} segment{segments !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm",
                result.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-800"
              )}
            >
              {result.success ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              )}
              {result.message}
            </div>
          )}

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!body.trim() || allRecipients.length === 0 || sending}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-sm transition-all min-h-[52px] touch-manipulation",
              body.trim() && allRecipients.length > 0 && !sending
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
            {sending
              ? "Sending..."
              : isDmMode
              ? "Send Direct Message"
              : "Send Blast"}
          </button>
        </div>

        {/* Summary panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-4">Send Summary</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Mode</span>
                <span className={cn("font-medium", isDmMode ? "text-blue-600" : "text-blue-700")}>
                  {isDmMode ? "Direct Message" : "Blast"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Recipients</span>
                <span className="font-medium text-slate-800">{allRecipients.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">SMS segments</span>
                <span className="font-medium text-slate-800">{segments}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Total SMS</span>
                <span className="font-bold text-slate-900">{allRecipients.length * segments}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                <span className="text-slate-500">Entrata log</span>
                <span className="text-amber-600 font-medium">Stubbed</span>
              </div>
            </div>
          </div>

          {allRecipients.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 mb-2">
                Recipients ({allRecipients.length})
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {allRecipients.slice(0, 10).map((r) => {
                  const isApplicant = recipientApplicants.some((a) => a.id === r.id);
                  const isProspect = recipientProspects.some((p) => p.id === r.id);
                  const isFutureResident = recipientFutureResidents.some((fr) => fr.id === r.id);
                  const label = isProspect ? "Prospect" : isFutureResident ? "Future Resident" : isApplicant ? "Applicant" : "Resident";
                  const colorClass = isProspect
                    ? "bg-teal-100 text-teal-700"
                    : isFutureResident
                    ? "bg-indigo-100 text-indigo-700"
                    : isApplicant
                    ? "bg-violet-100 text-violet-700"
                    : "bg-slate-100 text-slate-600";
                  return (
                    <div key={r.id} className="flex items-center gap-2 text-xs text-slate-600 py-1">
                      <div className={cn("w-6 h-6 rounded-full font-semibold text-xs flex items-center justify-center flex-shrink-0", colorClass)}>
                        {r.firstName[0]}
                      </div>
                      {label} · {r.unit || "—"}
                    </div>
                  );
                })}
                {allRecipients.length > 10 && (
                  <p className="text-xs text-slate-400">+{allRecipients.length - 10} more</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
