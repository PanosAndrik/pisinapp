import Link from "next/link";

import { withCompanyQuery } from "@/lib/reports/date-range";

type ReportsFiltersProps = {
  companyId: string;
  role: string;
  fromStr: string;
  toStr: string;
  tab: string;
  pools: Array<{ id: string; code: string; clientName: string }>;
  technicians: Array<{ id: string; fullName: string }>;
  poolId?: string;
  technicianId?: string;
};

export function ReportsFilters({
  companyId,
  role,
  fromStr,
  toStr,
  tab,
  pools,
  technicians,
  poolId,
  technicianId,
}: ReportsFiltersProps) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
      <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {role === "SUPER_ADMIN" ? <input type="hidden" name="companyId" value={companyId} /> : null}
        <input type="hidden" name="tab" value={tab} />

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Απο</label>
          <input
            name="from"
            type="date"
            defaultValue={fromStr}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Εως</label>
          <input
            name="to"
            type="date"
            defaultValue={toStr}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Πισινα</label>
          <select
            name="poolId"
            defaultValue={poolId ?? ""}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Ολες</option>
            {pools.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.clientName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Τεχνικος</label>
          <select
            name="technicianId"
            defaultValue={technicianId ?? ""}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Ολοι</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Εφαρμογη φιλτρων
          </button>
          <Link
            href={withCompanyQuery("/app/admin/reports", companyId, role, {
              tab,
              preset: "today",
            })}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
          >
            Σημερα
          </Link>
          <Link
            href={withCompanyQuery("/app/admin/reports", companyId, role, {
              tab,
              preset: "week",
            })}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
          >
            Εβδομαδα
          </Link>
          <a
            href={withCompanyQuery("/app/admin/reports/export", companyId, role, {
              from: fromStr,
              to: toStr,
              ...(poolId ? { poolId } : {}),
              ...(technicianId ? { technicianId } : {}),
            })}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
          >
            Εξαγωγη CSV
          </a>
        </div>
      </form>
    </section>
  );
}
