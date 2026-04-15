import { db } from "@/lib/db";
import ProspectList from "./ProspectList";

async function getProspects() {
  return db.prospect.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      property: { select: { id: true, name: true } },
      messages: { select: { messageId: true } },
    },
  });
}

async function getProperties() {
  return db.property.findMany({ orderBy: { name: "asc" } });
}

export default async function ProspectsPage() {
  const [prospects, properties] = await Promise.all([
    getProspects(),
    getProperties(),
  ]);

  return (
    <div className="px-4 py-5 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prospects</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {prospects.filter((p) => p.status === "active").length} active prospect{prospects.filter((p) => p.status === "active").length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
          <span className="w-3.5 h-3.5 inline-flex items-center justify-center">•</span>
          Entrata sync pending
        </div>
      </div>

      <ProspectList prospects={prospects} properties={properties} />
    </div>
  );
}
