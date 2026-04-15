import { db } from "@/lib/db";
import { Building2 } from "lucide-react";
import ApplicantList from "./ApplicantList";

async function getApplicants() {
  return db.applicant.findMany({
    orderBy: [{ property: { name: "asc" } }, { applicationDate: "desc" }],
    include: {
      property: { select: { name: true } },
      messages: { select: { messageId: true } },
    },
  });
}

async function getProperties() {
  return db.property.findMany({ orderBy: { name: "asc" } });
}

export default async function ApplicantsPage() {
  const [applicants, properties] = await Promise.all([
    getApplicants(),
    getProperties(),
  ]);

  return (
    <div className="px-4 py-5 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applicants</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {applicants.length} applicant{applicants.length !== 1 ? "s" : ""} across{" "}
            {properties.length} propert{properties.length !== 1 ? "ies" : "y"}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
          <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
          Entrata sync pending
        </div>
      </div>

      <ApplicantList applicants={applicants} />
    </div>
  );
}
