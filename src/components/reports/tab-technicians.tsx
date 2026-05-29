import Link from "next/link";

import type { TechnicianStatsRow } from "@/lib/reports/data";
import { withCompanyQuery } from "@/lib/reports/date-range";

type TabTechniciansProps = {
  companyId: string;
  role: string;
  technicianStats: TechnicianStatsRow[];
  fromStr: string;
  toStr: string;
};

export function TabTechnicians({
  companyId,
  role,
  technicianStats,
  fromStr,
  toStr,
}: TabTechniciansProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Αποδοση τεχνικων</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Με βαση τις επισκεψεις της επιλεγμενης περιοδου.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500">
              <th className="py-2 pr-3">Τεχνικος</th>
              <th className="py-2 pr-3">Επισκεψεις</th>
              <th className="py-2 pr-3">Διαφ. πισινες</th>
              <th className="py-2 pr-3">Επισκεψεις με alert</th>
              <th className="py-2 pr-3">Μεσος ορος πληροτητας</th>
              <th className="py-2">Αναλυτικα</th>
            </tr>
          </thead>
          <tbody>
            {technicianStats.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-zinc-600">
                  Δεν υπαρχουν δεδομενα στην περιοδο.
                </td>
              </tr>
            ) : (
              technicianStats.map((t) => (
                <tr key={t.technicianId} className="border-b border-zinc-100">
                  <td className="py-3 pr-3 font-medium text-zinc-900">{t.fullName}</td>
                  <td className="py-3 pr-3">{t.visitCount}</td>
                  <td className="py-3 pr-3">{t.poolCount}</td>
                  <td className="py-3 pr-3">{t.alertVisitCount}</td>
                  <td className="py-3 pr-3">{t.avgCompleteness}%</td>
                  <td className="py-3">
                    <Link
                      href={withCompanyQuery(
                        `/app/admin/reports/technicians/${t.technicianId}`,
                        companyId,
                        role,
                        { from: fromStr, to: toStr },
                      )}
                      className="text-xs font-medium text-zinc-800 underline"
                    >
                      Ανοιγμα
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
