import Link from "next/link";

import { SeverityBadge } from "@/components/reports/severity-badge";
import type { ReportVisit } from "@/lib/reports/data";
import { getVisitAlerts } from "@/lib/reports/visit-metrics";

type TabVisitsProps = {
  visits: ReportVisit[];
};

export function TabVisits({ visits }: TabVisitsProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">
        Επισκεψεις στην περιοδο ({visits.length})
      </h2>
      <div className="mt-4 space-y-2">
        {visits.length === 0 ? (
          <p className="text-zinc-600">Δεν βρεθηκαν επισκεψεις με τα τρεχοντα φιλτρα.</p>
        ) : (
          visits.map((visit) => {
            const alerts = getVisitAlerts(visit);
            return (
              <Link
                key={visit.id}
                href={`/app/admin/visits/${visit.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 p-3 transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                <div>
                  <p className="font-medium text-zinc-900">
                    {visit.pool.code} — {visit.pool.clientName}
                  </p>
                  <p className="text-sm text-zinc-600">
                    {new Date(visit.performedAt).toLocaleString("el-GR")} ·{" "}
                    {visit.technician?.fullName ?? "Χωρις τεχνικο"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    pH {visit.ph?.toString() ?? "—"} · Cl {visit.chlorinePpm?.toString() ?? "—"} ppm
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {alerts.length > 0 ? (
                    <SeverityBadge severity={alerts[0]!.severity} />
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
                      OK
                    </span>
                  )}
                  <span className="text-xs text-zinc-500">Λεπτομερειες →</span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
