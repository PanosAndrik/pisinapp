import Link from "next/link";

import { ReportsFilters } from "@/components/reports/reports-filters";
import { ReportsTabs } from "@/components/reports/reports-tabs";
import { TabAlerts } from "@/components/reports/tab-alerts";
import { TabOverview } from "@/components/reports/tab-overview";
import { TabPools } from "@/components/reports/tab-pools";
import { TabTechnicians } from "@/components/reports/tab-technicians";
import { TabVisits } from "@/components/reports/tab-visits";
import { requireAdminSession } from "@/lib/auth";
import {
  buildTechnicianStats,
  countAlertsBySeverity,
  loadPoolAlertRows,
  loadReportContext,
  loadVisitsInRange,
} from "@/lib/reports/data";
import { parseReportDateRange } from "@/lib/reports/date-range";

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams: Promise<{
    companyId?: string;
    from?: string;
    to?: string;
    preset?: string;
    tab?: string;
    poolId?: string;
    technicianId?: string;
  }>;
};

export default async function AdminReportsPage({ searchParams }: ReportsPageProps) {
  const session = await requireAdminSession();
  const params = await searchParams;

  const companyId =
    session.role === "SUPER_ADMIN" && params.companyId ? params.companyId : session.companyId;

  if (session.role === "SUPER_ADMIN" && !params.companyId) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        <h1 className="text-3xl font-semibold text-zinc-900">Reports</h1>
        <p className="text-zinc-600">
          Επελεξε πρωτα εταιρεια απο τον{" "}
          <Link href="/app/admin" className="font-medium underline">
            πινακα Admin
          </Link>{" "}
          και μετα ανοιξε Reports με το κουμπι εκει ή προσθεσε ?companyId= στο URL.
        </p>
      </main>
    );
  }

  const range = parseReportDateRange(params.from, params.to, params.preset);
  const tab = params.tab ?? "overview";
  const poolId = params.poolId?.trim() || undefined;
  const technicianId = params.technicianId?.trim() || undefined;

  const [{ pools, technicians }, visits, poolAlerts] = await Promise.all([
    loadReportContext(companyId),
    loadVisitsInRange(companyId, range, { poolId, technicianId }),
    loadPoolAlertRows(companyId),
  ]);

  const technicianStats = buildTechnicianStats(visits);
  const alertCounts = countAlertsBySeverity(poolAlerts);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">Reports & Στατιστικα</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Επισκοπηση, alerts, trends και αναλυτικα ανα πισινα / τεχνικο.
          </p>
        </div>
        <Link
          href={
            session.role === "SUPER_ADMIN"
              ? `/app/admin?companyId=${companyId}`
              : "/app/admin"
          }
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 hover:bg-zinc-100"
        >
          Πισω στο Admin
        </Link>
      </div>

      <ReportsFilters
        companyId={companyId}
        role={session.role}
        fromStr={range.fromStr}
        toStr={range.toStr}
        tab={tab}
        pools={pools}
        technicians={technicians}
        poolId={poolId}
        technicianId={technicianId}
      />

      <ReportsTabs
        companyId={companyId}
        role={session.role}
        activeTab={tab}
        fromStr={range.fromStr}
        toStr={range.toStr}
        poolId={poolId}
        technicianId={technicianId}
      />

      {tab === "overview" ? (
        <TabOverview
          companyId={companyId}
          role={session.role}
          visits={visits}
          poolAlerts={poolAlerts}
          technicianStats={technicianStats}
          alertCounts={{
            warning: alertCounts.warning,
            critical: alertCounts.critical,
          }}
        />
      ) : null}

      {tab === "alerts" ? (
        <TabAlerts companyId={companyId} role={session.role} poolAlerts={poolAlerts} />
      ) : null}

      {tab === "pools" ? (
        <TabPools
          companyId={companyId}
          role={session.role}
          poolAlerts={poolAlerts}
          fromStr={range.fromStr}
          toStr={range.toStr}
        />
      ) : null}

      {tab === "technicians" ? (
        <TabTechnicians
          companyId={companyId}
          role={session.role}
          technicianStats={technicianStats}
          fromStr={range.fromStr}
          toStr={range.toStr}
        />
      ) : null}

      {tab === "visits" ? <TabVisits visits={visits} /> : null}
    </main>
  );
}
