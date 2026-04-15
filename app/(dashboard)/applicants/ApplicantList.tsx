"use client";

import { useRouter } from "next/navigation";
import { ClipboardList, MessageSquare } from "lucide-react";
import { formatPhone } from "@/lib/utils";

const statusConfig: Record<string, { badge: string; label: string }> = {
  pending: { badge: "bg-amber-100 text-amber-700", label: "Pending" },
  approved: { badge: "bg-emerald-100 text-emerald-700", label: "Approved" },
  denied: { badge: "bg-red-100 text-red-700", label: "Denied" },
  waitlist: { badge: "bg-blue-100 text-blue-700", label: "Waitlist" },
  "future-resident": { badge: "bg-indigo-100 text-indigo-700", label: "Future Resident" },
  "moved-in": { badge: "bg-slate-100 text-slate-600", label: "Moved In" },
};

type Applicant = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  unit: string;
  email?: string | null;
  status: string;
  applicationDate: Date | string;
  property: { name: string };
  messages: { messageId: string }[];
};

export default function ApplicantList({ applicants }: { applicants: Applicant[] }) {
  const router = useRouter();

  function handleMessage(applicant: Applicant) {
    const participantType = applicant.status === "future-resident" ? "future-resident" : "applicant";
    router.push(`/messages?participantType=${participantType}&participantId=${applicant.id}`);
  }

  function StatusBadge({ status }: { status: string }) {
    const cfg = statusConfig[status] ?? { badge: "bg-slate-100 text-slate-500", label: status };
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${cfg.badge}`}>
        {cfg.label}
      </span>
    );
  }

  if (applicants.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 py-20 text-center">
        <ClipboardList className="w-10 h-10 mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500 font-medium">No applicants yet</p>
        <p className="text-slate-400 text-sm mt-1">
          Applicants will appear here once Entrata sync is enabled or seed data is loaded.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="lg:hidden space-y-3">
        {applicants.map((a) => (
          <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                {a.firstName[0]}{a.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{a.firstName} {a.lastName}</p>
                {a.email && <p className="text-xs text-slate-400 truncate">{a.email}</p>}
              </div>
              <StatusBadge status={a.status} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-50 rounded-lg px-2 py-2">
                <p className="text-slate-400 mb-0.5">Unit</p>
                <p className="font-mono font-semibold text-slate-700">{a.unit}</p>
              </div>
              <div className="bg-slate-50 rounded-lg px-2 py-2">
                <p className="text-slate-400 mb-0.5">Phone</p>
                <p className="font-semibold text-slate-700">{formatPhone(a.phone)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg px-2 py-2">
                <p className="text-slate-400 mb-0.5">Messages</p>
                <p className="font-semibold text-slate-700">{a.messages.length}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">{a.property.name}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => handleMessage(a)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Message
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-6 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Applicant</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Unit</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Property</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Applied</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Messages</th>
              <th className="text-left px-4 py-3 font-medium text-slate-500 uppercase text-xs tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applicants.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-semibold text-xs flex items-center justify-center flex-shrink-0">
                      {a.firstName[0]}{a.lastName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{a.firstName} {a.lastName}</p>
                      {a.email && <p className="text-xs text-slate-400">{a.email}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-600 font-mono text-xs">{a.unit}</td>
                <td className="px-4 py-4 text-slate-600">{formatPhone(a.phone)}</td>
                <td className="px-4 py-4 text-slate-600">{a.property.name}</td>
                <td className="px-4 py-4"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-4 text-slate-500 text-xs">{new Date(a.applicationDate).toLocaleDateString()}</td>
                <td className="px-4 py-4 text-slate-500">{a.messages.length}</td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => handleMessage(a)}
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
  );
}
