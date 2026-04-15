import { db } from "@/lib/db";
import { Building2 } from "lucide-react";
import { getEntrataSyncStatus } from "@/lib/entrata-sync";
import FutureResidentList from "./FutureResidentList";

async function getFutureResidents() {
  return db.applicant.findMany({
    where: { status: "future-resident" },
    orderBy: { applicationDate: "asc" },
    include: {
      property: { select: { id: true, name: true } },
      messages: { select: { messageId: true } },
    },
  });
}

export default async function FutureResidentsPage() {
  const futureResidents = await getFutureResidents();
  const syncStatus = getEntrataSyncStatus();

  return (
    <div className="px-4 py-5 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Future Residents</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {futureResidents.length} future resident{futureResidents.length !== 1 ? "s" : ""} pending move-in
          </p>
        </div>
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${syncStatus.badgeClass}`}>
          <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
          {syncStatus.label}
        </div>
      </div>

      <FutureResidentList futureResidents={futureResidents} />
    </div>
  );
}
