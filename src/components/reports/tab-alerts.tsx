import Link from "next/link";

import { SeverityBadge } from "@/components/reports/severity-badge";
import type { PoolAlertRow } from "@/lib/reports/data";
import { withCompanyQuery } from "@/lib/reports/date-range";

type TabAlertsProps = {
  companyId: string;
  role: string;
  poolAlerts: PoolAlertRow[];
};

export function TabAlerts({ companyId, role, poolAlerts }: TabAlertsProps) {
  const withIssues = poolAlerts
    .filter((p) => p.alerts.length > 0)
    .sort((a, b) => {
      const sev = (row: PoolAlertRow) =>
        row.alerts.some((a) => a.severity === "critical") ? 2 : row.alerts.length > 0 ? 1 : 0;
      return sev(b) - sev(a);
    });

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Ενεργα alerts (τελευταια επίσκεψη ανά πισινα)</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Βασιζεται στις τελευταιες μετρησεις και στο αν η πισινα εχει αργησει να επισκεφθει.
      </p>
      <div className="mt-4 space-y-3">
        {withIssues.length === 0 ? (
          <p className="text-zinc-600">Δεν υπαρχουν ενεργα alerts αυτη τη στιγμη.</p>
        ) : (
          withIssues.map((row) => (
            <article key={row.poolId} className="rounded-xl border border-zinc-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-zinc-900">
                    {row.poolCode} — {row.clientName}
                  </h3>
                  {row.lastVisitAt ? (
                    <p className="text-sm text-zinc-600">
                      Τελευταια επίσκεψη: {new Date(row.lastVisitAt).toLocaleString("el-GR")}
                      {row.daysWithoutVisit != null ? ` (${row.daysWithoutVisit} ημ.)` : ""}
                    </p>
                  ) : (
                    <p className="text-sm text-red-700">Ποτε δεν καταχωρηθηκε επίσκεψη</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {row.latestVisitId ? (
                    <Link
                      href={`/app/admin/visits/${row.latestVisitId}`}
                      className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-800 hover:bg-zinc-50"
                    >
                      Τελευταια επίσκεψη
                    </Link>
                  ) : null}
                  <Link
                    href={withCompanyQuery(
                      `/app/admin/reports/pools/${row.poolId}`,
                      companyId,
                      role,
                    )}
                    className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
                  >
                    Report πισινας
                  </Link>
                </div>
              </div>
              <ul className="mt-3 space-y-2">
                {row.alerts.map((alert, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-zinc-800">
                    <SeverityBadge severity={alert.severity} />
                    {alert.message}
                  </li>
                ))}
              </ul>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
