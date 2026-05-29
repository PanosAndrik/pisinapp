import Link from "next/link";

import { SeverityBadge } from "@/components/reports/severity-badge";
import type { PoolAlertRow, ReportVisit, TechnicianStatsRow } from "@/lib/reports/data";
import { withCompanyQuery } from "@/lib/reports/date-range";
import { getVisitAlerts } from "@/lib/reports/visit-metrics";

type TabOverviewProps = {
  companyId: string;
  role: string;
  visits: ReportVisit[];
  poolAlerts: PoolAlertRow[];
  technicianStats: TechnicianStatsRow[];
  alertCounts: { warning: number; critical: number };
};

export function TabOverview({
  companyId,
  role,
  visits,
  poolAlerts,
  technicianStats,
  alertCounts,
}: TabOverviewProps) {
  const poolsWithAlerts = poolAlerts.filter((p) => p.alerts.length > 0).slice(0, 8);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayVisits = visits.filter((v) => v.performedAt >= todayStart);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Επισκεψεις (περιοδος)" value={String(visits.length)} />
        <StatCard label="Σημερα" value={String(todayVisits.length)} />
        <StatCard label="Alerts (προσοχη)" value={String(alertCounts.warning)} />
        <StatCard label="Alerts (κρισιμο)" value={String(alertCounts.critical)} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Πισινες που χρειαζονται προσοχη</h2>
          <div className="mt-4 space-y-3">
            {poolsWithAlerts.length === 0 ? (
              <p className="text-sm text-zinc-600">Ολα καλα — χωρις ενεργα alerts.</p>
            ) : (
              poolsWithAlerts.map((row) => (
                <div key={row.poolId} className="rounded-xl border border-zinc-200 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-zinc-900">
                        {row.poolCode} — {row.clientName}
                      </p>
                      {row.lastVisitAt ? (
                        <p className="text-xs text-zinc-500">
                          Τελευταια: {new Date(row.lastVisitAt).toLocaleString("el-GR")}
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href={withCompanyQuery(
                        `/app/admin/reports/pools/${row.poolId}`,
                        companyId,
                        role,
                      )}
                      className="text-xs font-medium text-zinc-700 underline"
                    >
                      Αναλυτικα
                    </Link>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {row.alerts.slice(0, 3).map((a, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-zinc-700">
                        <SeverityBadge severity={a.severity} />
                        <span>{a.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Τεχνικοι (περιοδος)</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500">
                  <th className="py-2 pr-2">Ονομα</th>
                  <th className="py-2 pr-2">Επισκεψεις</th>
                  <th className="py-2 pr-2">Με alerts</th>
                  <th className="py-2">Πληροτητα</th>
                </tr>
              </thead>
              <tbody>
                {technicianStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-zinc-600">
                      Δεν υπαρχουν επισκεψεις στην περιοδο.
                    </td>
                  </tr>
                ) : (
                  technicianStats.map((t) => (
                    <tr key={t.technicianId} className="border-b border-zinc-100">
                      <td className="py-2 pr-2">
                        <Link
                          href={withCompanyQuery(
                            `/app/admin/reports/technicians/${t.technicianId}`,
                            companyId,
                            role,
                          )}
                          className="font-medium text-zinc-900 underline"
                        >
                          {t.fullName}
                        </Link>
                      </td>
                      <td className="py-2 pr-2">{t.visitCount}</td>
                      <td className="py-2 pr-2">{t.alertVisitCount}</td>
                      <td className="py-2">{t.avgCompleteness}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Προσφατες επισκεψεις (περιοδος)</h2>
        <div className="mt-4 space-y-2">
          {visits.slice(0, 10).map((visit) => {
            const alerts = getVisitAlerts(visit);
            return (
              <div
                key={visit.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-zinc-900">
                    {visit.pool.code} — {visit.pool.clientName}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {new Date(visit.performedAt).toLocaleString("el-GR")} ·{" "}
                    {visit.technician?.fullName ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {alerts.length > 0 ? (
                    <SeverityBadge severity={alerts[0]!.severity} />
                  ) : (
                    <span className="text-xs text-emerald-700">OK</span>
                  )}
                  <Link
                    href={`/app/admin/visits/${visit.id}`}
                    className="text-xs font-medium text-zinc-700 underline"
                  >
                    Λεπτομερειες
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-zinc-900">{value}</p>
    </article>
  );
}
