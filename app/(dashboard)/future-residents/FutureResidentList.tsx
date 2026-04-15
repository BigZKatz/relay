"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhone, formatDate } from "@/lib/utils";

type FutureResident = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  unit: string;
  applicationDate: Date | string;
  property: { id: string; name: string };
  messages: { messageId: string }[];
};

interface Props {
  futureResidents: FutureResident[];
}

export default function FutureResidentList({ futureResidents: initial }: Props) {
  const router = useRouter();
  const [futureResidents] = useState<FutureResident[]>(initial);

  function handleMessage(fr: FutureResident) {
    router.push(`/messages?participantType=future-resident&participantId=${fr.id}`);
  }

  if (futureResidents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 py-20 text-center">
        <Users className="w-10 h-10 mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500 font-medium">No future residents</p>
        <p className="text-slate-400 text-sm mt-1">People who move to future resident status in Entrata appear here automatically</p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {futureResidents.map((fr) => (
          <div key={fr.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                {fr.firstName[0]}{fr.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{fr.firstName} {fr.lastName}</p>
                {fr.email && <p className="text-xs text-slate-400 truncate">{fr.email}</p>}
              </div>
              <span className="text-xs px-2 py-1 rounded-full font-medium bg-indigo-100 text-indigo-700 flex-shrink-0">
                future resident
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-50 rounded-lg px-2 py-2">
                <p className="text-slate-400 mb-0.5">Unit</p>
                <p className="font-mono font-semibold text-slate-700">{fr.unit}</p>
              </div>
              <div className="bg-slate-50 rounded-lg px-2 py-2">
                <p className="text-slate-400 mb-0.5">Phone</p>
                <p className="font-semibold text-slate-700">{formatPhone(fr.phone)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg px-2 py-2">
                <p className="text-slate-400 mb-0.5">Move-in</p>
                <p className="font-semibold text-slate-700">{formatDate(new Date(fr.applicationDate))}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">{fr.property.name}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => handleMessage(fr)}
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
              <th className="text-left px-6 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Unit</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Property</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Move-in Date</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Lease</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {futureResidents.map((fr) => (
              <tr key={fr.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                      {fr.firstName[0]}{fr.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{fr.firstName} {fr.lastName}</p>
                      {fr.email && <p className="text-xs text-slate-400">{fr.email}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-600 font-mono text-xs">{fr.unit}</td>
                <td className="px-4 py-4 text-slate-600">{formatPhone(fr.phone)}</td>
                <td className="px-4 py-4 text-slate-600">{fr.property.name}</td>
                <td className="px-4 py-4 text-slate-600 text-xs">{formatDate(new Date(fr.applicationDate))}</td>
                <td className="px-4 py-4">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full font-medium",
                    fr.messages.length > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  )}>
                    {fr.messages.length > 0 ? "Contacted" : "Pending"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleMessage(fr)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Message
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-400">{futureResidents.length} future resident{futureResidents.length !== 1 ? "s" : ""}</p>
    </>
  );
}
