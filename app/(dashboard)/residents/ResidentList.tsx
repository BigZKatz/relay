"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPhone } from "@/lib/utils";
import { Users, Search, X, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type Resident = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  unit: string;
  email?: string | null;
  status: string;
  property: { id: string; name: string };
  messages: { messageId: string }[];
};

type Property = {
  id: string;
  name: string;
};

const statusConfig: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-500",
  pending: "bg-amber-100 text-amber-700",
};

interface Props {
  residents: Resident[];
  properties: Property[];
}

export default function ResidentList({ residents, properties }: Props) {
  const router = useRouter();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [search, setSearch] = useState("");

  function handleMessage(resident: Resident) {
    router.push(`/messages?participantType=resident&participantId=${resident.id}`);
  }

  const propertyFiltered =
    selectedPropertyId === "all"
      ? residents
      : residents.filter((r) => r.property.id === selectedPropertyId);

  const filtered = search
    ? propertyFiltered.filter((r) =>
        `${r.firstName} ${r.lastName} ${r.unit} ${r.phone} ${r.property.name}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : propertyFiltered;

  return (
    <>
      {/* Property filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          type="button"
          onClick={() => setSelectedPropertyId("all")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] cursor-pointer touch-manipulation",
            selectedPropertyId === "all"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          All ({residents.length})
        </button>
        {properties.map((p) => {
          const count = residents.filter((r) => r.property.id === p.id).length;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPropertyId(p.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] cursor-pointer touch-manipulation",
                selectedPropertyId === p.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {p.name} ({count})
            </button>
          );
        })}
      </div>

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search residents by name, unit, phone, or property..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 placeholder-slate-400"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 py-20 text-center">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500 font-medium">No residents found</p>
          {search && (
            <p className="text-slate-400 text-sm mt-1">Try a different search or clear the filter</p>
          )}
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {r.firstName[0]}{r.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">
                      {r.firstName} {r.lastName}
                    </p>
                    {r.email && (
                      <p className="text-xs text-slate-400 truncate">{r.email}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${statusConfig[r.status] ?? "bg-slate-100 text-slate-500"}`}>
                    {r.status}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-50 rounded-lg px-2 py-2">
                    <p className="text-slate-400 mb-0.5">Unit</p>
                    <p className="font-mono font-semibold text-slate-700">{r.unit}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg px-2 py-2">
                    <p className="text-slate-400 mb-0.5">Phone</p>
                    <p className="font-semibold text-slate-700">{formatPhone(r.phone)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg px-2 py-2">
                    <p className="text-slate-400 mb-0.5">Messages</p>
                    <p className="font-semibold text-slate-700">{r.messages.length}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">{r.property.name}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleMessage(r)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Resident</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Unit</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Property</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Messages</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                          {r.firstName[0]}{r.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{r.firstName} {r.lastName}</p>
                          {r.email && <p className="text-xs text-slate-400">{r.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600 font-mono text-xs">{r.unit}</td>
                    <td className="px-4 py-4 text-slate-600">{formatPhone(r.phone)}</td>
                    <td className="px-4 py-4 text-slate-600">{r.property.name}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusConfig[r.status] ?? "bg-slate-100 text-slate-500"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500">{r.messages.length}</td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => handleMessage(r)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Message
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
