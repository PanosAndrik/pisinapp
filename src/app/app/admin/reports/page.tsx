import { ReportsFilters } from "@/components/reports/reports-filters";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { adminHref } from "@/lib/admin-nav";
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
      <PageShell>
        <PageHeader
          title="Reports"
          subtitle="Επελεξε πρωτα εταιρεια απο τον πινακα Admin."
          backHref="/app/super-admin"
          backLabel="Πισω στην Υπερ Διαχειριση"
        />
      </PageShell>
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

  const isSuperAdmin = session.role === "SUPER_ADMIN";

  return (
    <PageShell>
      <PageHeader
        title="Reports & Στατιστικα"
        subtitle="Επισκοπηση, alerts, trends και αναλυτικα ανα πισινα / τεχνικο."
        backHref={adminHref("/app/admin", { companyId, isSuperAdmin })}
        backLabel="Πισω στο Admin"
      />

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
    </PageShell>
  );
}
