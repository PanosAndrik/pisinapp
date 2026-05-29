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
import {
  buildTrend,
  loadVisitsInRange,
} from "@/lib/reports/data";
import { parseReportDateRange, withCompanyQuery } from "@/lib/reports/date-range";
import { WATER_THRESHOLDS } from "@/lib/reports/thresholds";
import {
  daysSince,
  getNoVisitAlert,
  getVisitAlerts,
} from "@/lib/reports/visit-metrics";

export const dynamic = "force-dynamic";

type PoolDetailPageProps = {
  params: Promise<{ poolId: string }>;
  searchParams: Promise<{ companyId?: string; from?: string; to?: string; preset?: string }>;
};

export default async function PoolDetailPage({ params, searchParams }: PoolDetailPageProps) {
  const session = await requireAdminSession();
  const { poolId } = await params;
  const sp = await searchParams;

  const companyId =
    session.role === "SUPER_ADMIN" && sp.companyId ? sp.companyId : session.companyId;
  const isSuperAdmin = session.role === "SUPER_ADMIN";

  const pool = await prisma.pool.findFirst({
    where: { id: poolId, companyId },
    select: {
      id: true,
      code: true,
      clientName: true,
      address: true,
      volumeLiters: true,
      notes: true,
      createdAt: true,
    },
  });

  if (!pool) notFound();

  const range = parseReportDateRange(sp.from, sp.to, sp.preset);

  const [rangeVisits, recentVisits, visitCount, latestVisit] = await Promise.all([
    loadVisitsInRange(companyId, range, { poolId }),
    prisma.visit.findMany({
      where: { companyId, poolId },
      orderBy: { performedAt: "desc" },
      take: 30,
      select: {
        id: true,
        performedAt: true,
        ph: true,
        chlorinePpm: true,
        pressureBar: true,
        technician: { select: { fullName: true } },
      },
    }),
    prisma.visit.count({ where: { companyId, poolId } }),
    prisma.visit.findFirst({
      where: { companyId, poolId },
      orderBy: { performedAt: "desc" },
      select: {
        id: true,
        performedAt: true,
        ph: true,
        chlorinePpm: true,
        pressureBar: true,
        waterClarityOk: true,
        pressureBarSecondary: true,
        totalChlorinePpm: true,
        hardnessPpm: true,
        alkalinityPpm: true,
        oxygenConcentrationPpm: true,
        cyanuricAcidPpm: true,
        ironPpm: true,
        microbeTest: true,
      },
    }),
  ]);

  const now = new Date();
  const statusAlerts = latestVisit
    ? (() => {
        const days = daysSince(latestVisit.performedAt, now);
        const alerts = [];
        const noVisit = getNoVisitAlert(days);
        if (noVisit) alerts.push(noVisit);
        alerts.push(...getVisitAlerts(latestVisit));
        return { days, alerts };
      })()
    : {
        days: null as number | null,
        alerts: [
          {
            type: "NO_VISIT" as const,
            severity: "critical" as const,
            message: "Ποτε δεν καταχωρηθηκε επίσκεψη",
          },
        ],
      };

  const phTrend = buildTrend(rangeVisits, "ph");
  const clTrend = buildTrend(rangeVisits, "chlorinePpm");
  const pressureTrend = buildTrend(rangeVisits, "pressureBar");

  const reportsPoolHref = adminHref(`/app/admin/reports/pools/${pool.id}`, {
    companyId,
    isSuperAdmin,
    query: { from: range.fromStr, to: range.toStr },
  });

  return (
    <PageShell>
      <PageHeader
        title={pool.code}
        subtitle={[pool.clientName, pool.address].filter(Boolean).join(" · ")}
        backHref={adminHref("/app/admin/pools", { companyId, isSuperAdmin })}
        backLabel="Πισω στις πισινες"
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Link
              href={reportsPoolHref}
              className="touch-target inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-3 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-100 sm:py-2"
            >
              Αναλυτικο report
            </Link>
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
          </div>
        }
      />

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-zinc-900">Στοιχεια πισινας</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Πελατης</dt>
            <dd className="font-medium text-zinc-900">{pool.clientName}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Διευθυνση</dt>
            <dd className="font-medium text-zinc-900">{pool.address ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Ογκος</dt>
            <dd className="font-medium text-zinc-900">
              {pool.volumeLiters ? `${pool.volumeLiters.toLocaleString("el-GR")} L` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Συνολικες επισκεψεις</dt>
            <dd className="font-medium text-zinc-900">{visitCount}</dd>
          </div>
        </dl>
        {pool.notes ? (
          <p className="mt-3 text-sm text-zinc-600">
            <span className="font-medium text-zinc-700">Σημειωσεις: </span>
            {pool.notes}
          </p>
        ) : null}
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-zinc-900">Κατασταση τωρα</h2>
        {latestVisit ? (
          <div className="mt-3 space-y-2 text-sm text-zinc-700">
            <p>
              Τελευταια επίσκεψη:{" "}
              <span className="font-medium text-zinc-900">
                {new Date(latestVisit.performedAt).toLocaleString("el-GR")}
              </span>
              {statusAlerts.days != null ? (
                <span className="text-zinc-500"> ({statusAlerts.days} ημερες πριν)</span>
              ) : null}
            </p>
            <p>
              Τελευταιες μετρησεις: pH {latestVisit.ph?.toString() ?? "—"} · Cl{" "}
              {latestVisit.chlorinePpm?.toString() ?? "—"} ppm · Πιεση{" "}
              {latestVisit.pressureBar?.toString() ?? "—"} bar
            </p>
            {latestVisit.id ? (
              <Link
                href={`/app/admin/visits/${latestVisit.id}`}
                className="inline-block text-sm font-medium text-zinc-800 underline"
              >
                Δες την τελευταια επίσκεψη
              </Link>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-600">Δεν υπαρχει καταχωρημενη επίσκεψη.</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {statusAlerts.alerts.length === 0 ? (
            <span className="text-sm font-medium text-emerald-700">Κατασταση OK</span>
          ) : (
            statusAlerts.alerts.map((alert, i) => (
              <SeverityBadge key={i} severity={alert.severity} />
            ))
          )}
        </div>
      </section>

      <section className={cardClass}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-semibold text-zinc-900">Τάσεις (τελευταίες 30 ημερες)</h2>
          <p className="text-xs text-zinc-500">
            {range.fromStr} — {range.toStr} · {rangeVisits.length} επισκεψεις στην περιοδο
          </p>
        </div>
        {rangeVisits.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">Δεν υπαρχουν μετρησεις στην περιοδο.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
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
          </div>
        )}
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-zinc-900">Ιστορικο επισκεψεων</h2>
        <div className="mt-4 space-y-2">
          {recentVisits.length === 0 ? (
            <p className="text-zinc-600">Δεν υπαρχουν επισκεψεις ακομα.</p>
          ) : (
            recentVisits.map((visit) => (
              <Link
                key={visit.id}
                href={`/app/admin/visits/${visit.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 p-3 hover:bg-zinc-50"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900">
                    {new Date(visit.performedAt).toLocaleString("el-GR")}
                  </p>
                  <p className="text-sm text-zinc-600">
                    {visit.technician?.fullName ?? "—"} · pH {visit.ph?.toString() ?? "—"} · Cl{" "}
                    {visit.chlorinePpm?.toString() ?? "—"}
                  </p>
                </div>
                <span className="text-xs font-medium text-zinc-500">Λεπτομερειες →</span>
              </Link>
            ))
          )}
        </div>
        {visitCount > recentVisits.length ? (
          <p className="mt-3 text-sm text-zinc-500">
            Εμφανιζονται οι {recentVisits.length} πιο προσφατες απο {visitCount} συνολικα. Για
            πληρες ιστορικο και χημικα, δες το{" "}
            <Link href={reportsPoolHref} className="font-medium text-zinc-800 underline">
              αναλυτικο report
            </Link>
            .
          </p>
        ) : null}
      </section>
    </PageShell>
  );
}
