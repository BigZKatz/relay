"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Users, MessageSquare, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhone, formatDate } from "@/lib/utils";

type Prospect = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  unitInterest?: string | null;
  source?: string | null;
  status: string;
  createdAt: Date | string;
  property: { id: string; name: string };
  messages: { messageId: string }[];
};

type Property = {
  id: string;
  name: string;
};

interface Props {
  prospects: Prospect[];
  properties: Property[];
}

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  unitInterest: string;
  notes: string;
  source: string;
  propertyId: string;
}

const statusConfig: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  converted: "bg-blue-100 text-blue-700",
  inactive: "bg-slate-100 text-slate-500",
};

export default function ProspectList({ prospects: initial, properties }: Props) {
  const router = useRouter();
  const [prospects, setProspects] = useState<Prospect[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    unitInterest: "",
    notes: "",
    source: "",
    propertyId: properties[0]?.id ?? "",
  });

  const activeProspects = prospects.filter((p) => p.status === "active");

  async function handleAddProspect(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.phone || !form.propertyId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setProspects((prev) => [data.prospect, ...prev]);
        setShowForm(false);
        setForm({ firstName: "", lastName: "", phone: "", email: "", unitInterest: "", notes: "", source: "", propertyId: properties[0]?.id ?? "" });
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleMessage(prospect: Prospect) {
    router.push(`/messages?participantType=prospect&participantId=${prospect.id}`);
  }

  return (
    <>
      {/* Add Prospect button */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add Prospect
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-5 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">New Prospect</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleAddProspect} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone *</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Unit Interest</label>
              <input
                type="text"
                value={form.unitInterest}
                onChange={(e) => setForm((f) => ({ ...f, unitInterest: e.target.value }))}
                placeholder="e.g. 1BR, Unit 204"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Source</label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                placeholder="e.g. Zillow, walk-in"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Property *</label>
              <div className="relative">
                <select
                  required
                  value={form.propertyId}
                  onChange={(e) => setForm((f) => ({ ...f, propertyId: e.target.value }))}
                  className="w-full appearance-none border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 resize-none"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Adding..." : "Add Prospect"}
              </button>
            </div>
          </form>
        </div>
      )}

      {prospects.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-20 text-center">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">No prospects yet</p>
          <p className="text-slate-400 text-sm mt-1">Click &ldquo;Add Prospect&rdquo; to get started</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {prospects.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {p.firstName[0]}{p.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">{p.firstName} {p.lastName}</p>
                    {p.email && <p className="text-xs text-slate-400 truncate">{p.email}</p>}
                  </div>
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium flex-shrink-0", statusConfig[p.status] ?? "bg-slate-100 text-slate-500")}>
                    {p.status}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-50 rounded-lg px-2 py-2">
                    <p className="text-slate-400 mb-0.5">Phone</p>
                    <p className="font-semibold text-slate-700">{formatPhone(p.phone)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg px-2 py-2">
                    <p className="text-slate-400 mb-0.5">Unit</p>
                    <p className="font-mono font-semibold text-slate-700">{p.unitInterest ?? "—"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg px-2 py-2">
                    <p className="text-slate-400 mb-0.5">Source</p>
                    <p className="font-semibold text-slate-700 truncate">{p.source ?? "—"}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">{p.property.name} · Added {formatDate(new Date(p.createdAt))}</p>
                {p.status === "active" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleMessage(p)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Message
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Prospect</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Unit Interest</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Property</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Added</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prospects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                          {p.firstName[0]}{p.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{p.firstName} {p.lastName}</p>
                          {p.email && <p className="text-xs text-slate-400">{p.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{formatPhone(p.phone)}</td>
                    <td className="px-4 py-4 text-slate-600 font-mono text-xs">{p.unitInterest ?? "—"}</td>
                    <td className="px-4 py-4 text-slate-600">{p.source ?? "—"}</td>
                    <td className="px-4 py-4 text-slate-600">{p.property.name}</td>
                    <td className="px-4 py-4">
                      <span className={cn("text-xs px-2 py-1 rounded-full font-medium", statusConfig[p.status] ?? "bg-slate-100 text-slate-500")}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-xs">{formatDate(new Date(p.createdAt))}</td>
                    <td className="px-4 py-4">
                      {p.status === "active" && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleMessage(p)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Message
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Summary */}
      {prospects.length > 0 && (
        <p className="mt-4 text-xs text-slate-400">
          {activeProspects.length} active · {prospects.filter((p) => p.status === "converted").length} converted
        </p>
      )}
    </>
  );
}
