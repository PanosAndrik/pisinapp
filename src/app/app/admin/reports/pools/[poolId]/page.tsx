import Link from "next/link";
import { notFound } from "next/navigation";

import { SparklineChart } from "@/components/reports/sparkline-chart";
import { SeverityBadge } from "@/components/reports/severity-badge";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { btnPrimaryClass, cardClass } from "@/components/ui/field-styles";
import { adminHref } from "@/lib/admin-nav";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CHEMICAL_LABELS } from "@/lib/visit-labels";
import {
  aggregateChemicalUsage,
  buildTrend,
  loadVisitsInRange,
} from "@/lib/reports/data";
import { parseReportDateRange, withCompanyQuery } from "@/lib/reports/date-range";
import { WATER_THRESHOLDS } from "@/lib/reports/thresholds";
import { getVisitAlerts } from "@/lib/reports/visit-metrics";

export const dynamic = "force-dynamic";

type PoolReportPageProps = {
  params: Promise<{ poolId: string }>;
  searchParams: Promise<{
    companyId?: string;
    from?: string;
    to?: string;
    preset?: string;
  }>;
};

export default async function PoolReportPage({ params, searchParams }: PoolReportPageProps) {
  const session = await requireAdminSession();
  const { poolId } = await params;
  const sp = await searchParams;

  const companyId =
    session.role === "SUPER_ADMIN" && sp.companyId ? sp.companyId : session.companyId;

  const pool = await prisma.pool.findFirst({
    where: { id: poolId, companyId },
    select: {
      id: true,
      code: true,
      clientName: true,
      address: true,
      volumeLiters: true,
      notes: true,
    },
  });

  if (!pool) notFound();

  const range = parseReportDateRange(sp.from, sp.to, sp.preset);
  const visits = await loadVisitsInRange(companyId, range, { poolId });

  const phTrend = buildTrend(visits, "ph");
  const clTrend = buildTrend(visits, "chlorinePpm");
  const pressureTrend = buildTrend(visits, "pressureBar");
  const chemicals = aggregateChemicalUsage(visits);

  const isSuperAdmin = session.role === "SUPER_ADMIN";

  return (
    <PageShell>
      <PageHeader
        title={`Report πισινας: ${pool.code}`}
        subtitle={[pool.clientName, pool.address].filter(Boolean).join(" · ")}
        backHref={adminHref("/app/admin/reports", {
          companyId,
          isSuperAdmin,
          query: { tab: "pools", from: range.fromStr, to: range.toStr },
        })}
        backLabel="Πισω στα Reports"
        actions={
          <Link
            href={withCompanyQuery("/app/admin/reports/print", companyId, session.role, {
              poolId: pool.id,
              from: range.fromStr,
              to: range.toStr,
            })}
            target="_blank"
            rel="noopener noreferrer"
            prefetch={false}
            className={`${btnPrimaryClass} inline-flex w-auto px-4 py-2`}
          >
            Εκτυπωση / PDF
          </Link>
        }
      />

      <section className={cardClass}>
        <p className="text-sm text-zinc-600">
          Περιοδος: {range.fromStr} — {range.toStr} · {visits.length} επισκεψεις
        </p>
        {pool.volumeLiters ? (
          <p className="mt-1 text-sm text-zinc-600">
            Ογκος: {pool.volumeLiters.toLocaleString("el-GR")} L
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SparklineChart
          title="pH"
          unit=""
          points={phTrend}
          referenceMin={WATER_THRESHOLDS.phMin}
          referenceMax={WATER_THRESHOLDS.phMax}
        />
        <SparklineChart
          title="Ελευθερο χλωριο"
          unit="ppm"
          points={clTrend}
          referenceMin={WATER_THRESHOLDS.freeChlorineMin}
        />
        <SparklineChart
          title="Πιεση φιλτρου 1/2"
          unit="bar"
          points={pressureTrend}
          referenceMax={WATER_THRESHOLDS.pressureMax}
        />
      </section>

      {chemicals.size > 0 ? (
        <section className={cardClass}>
          <h2 className="text-lg font-semibold text-zinc-900">Προσθηκες χημικων (συνολα περιοδου)</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {Array.from(chemicals.entries()).map(([key, total]) => (
              <li
                key={key}
                className="flex justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              >
                <span className="text-zinc-700">{CHEMICAL_LABELS[key] ?? key}</span>
                <span className="font-medium text-zinc-900">{total}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-zinc-900">Ιστορικο επισκεψεων</h2>
        <div className="mt-4 space-y-2">
          {visits.length === 0 ? (
            <p className="text-zinc-600">Δεν υπαρχουν επισκεψεις στην περιοδο.</p>
          ) : (
            visits.map((visit) => {
              const alerts = getVisitAlerts(visit);
              return (
                <Link
                  key={visit.id}
                  href={`/app/admin/visits/${visit.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 p-3 hover:bg-zinc-50"
                >
                  <div>
                    <p className="font-medium text-zinc-900">
                      {new Date(visit.performedAt).toLocaleString("el-GR")}
                    </p>
                    <p className="text-sm text-zinc-600">
                      {visit.technician?.fullName ?? "—"} · pH {visit.ph?.toString() ?? "—"} · Cl{" "}
                      {visit.chlorinePpm?.toString() ?? "—"}
                    </p>
                  </div>
                  {alerts.length > 0 ? (
                    <SeverityBadge severity={alerts[0]!.severity} />
                  ) : (
                    <span className="text-xs text-emerald-700">OK</span>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </section>
    </PageShell>
  );
}
