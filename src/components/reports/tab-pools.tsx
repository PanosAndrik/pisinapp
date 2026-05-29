import Link from "next/link";

import { SeverityBadge } from "@/components/reports/severity-badge";
import type { PoolAlertRow } from "@/lib/reports/data";
import { adminHref } from "@/lib/admin-nav";
import { withCompanyQuery } from "@/lib/reports/date-range";

type TabPoolsProps = {
  companyId: string;
  role: string;
  poolAlerts: PoolAlertRow[];
  fromStr: string;
  toStr: string;
};

export function TabPools({ companyId, role, poolAlerts, fromStr, toStr }: TabPoolsProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Ολες οι ενεργες πισινες</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500">
              <th className="py-2 pr-3">Πισινα</th>
              <th className="py-2 pr-3">Τελευταια επίσκεψη</th>
              <th className="py-2 pr-3">Ημερες</th>
              <th className="py-2 pr-3">Alerts</th>
              <th className="py-2">Ενεργειες</th>
            </tr>
          </thead>
          <tbody>
            {poolAlerts.map((row) => (
              <tr key={row.poolId} className="border-b border-zinc-100">
                <td className="py-3 pr-3 font-medium text-zinc-900">
                  {row.poolCode}
                  <span className="block text-xs font-normal text-zinc-500">{row.clientName}</span>
                </td>
                <td className="py-3 pr-3 text-zinc-700">
                  {row.lastVisitAt
                    ? new Date(row.lastVisitAt).toLocaleString("el-GR")
                    : "—"}
                </td>
                <td className="py-3 pr-3">{row.daysWithoutVisit ?? "—"}</td>
                <td className="py-3 pr-3">
                  {row.alerts.length === 0 ? (
                    <span className="text-emerald-700">OK</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {row.alerts.slice(0, 2).map((a, i) => (
                        <SeverityBadge key={i} severity={a.severity} />
                      ))}
                      {row.alerts.length > 2 ? (
                        <span className="text-xs text-zinc-500">+{row.alerts.length - 2}</span>
                      ) : null}
                    </div>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={adminHref(`/app/admin/pools/${row.poolId}`, {
                        companyId,
                        isSuperAdmin: role === "SUPER_ADMIN",
                      })}
                      className="text-xs font-medium text-zinc-800 underline"
                    >
                      Προφιλ
                    </Link>
                    <Link
                      href={withCompanyQuery(
                        `/app/admin/reports/pools/${row.poolId}`,
                        companyId,
                        role,
                        { from: fromStr, to: toStr },
                      )}
                      className="text-xs font-medium text-zinc-800 underline"
                    >
                      Report
                    </Link>
                    <Link
                      href={withCompanyQuery("/app/admin/reports/print", companyId, role, {
                        poolId: row.poolId,
                        from: fromStr,
                        to: toStr,
                      })}
                      className="text-xs font-medium text-zinc-800 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      prefetch={false}
                    >
                      Εκτυπωση
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
