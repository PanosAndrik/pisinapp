import Link from "next/link";
import { notFound } from "next/navigation";

import { SeverityBadge } from "@/components/reports/severity-badge";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadVisitsInRange } from "@/lib/reports/data";
import { parseReportDateRange, withCompanyQuery } from "@/lib/reports/date-range";
import { getVisitAlerts, getVisitCompletenessPercent } from "@/lib/reports/visit-metrics";

export const dynamic = "force-dynamic";

type TechnicianReportPageProps = {
  params: Promise<{ technicianId: string }>;
  searchParams: Promise<{
    companyId?: string;
    from?: string;
    to?: string;
    preset?: string;
  }>;
};

export default async function TechnicianReportPage({
  params,
  searchParams,
}: TechnicianReportPageProps) {
  const session = await requireAdminSession();
  const { technicianId } = await params;
  const sp = await searchParams;

  const companyId =
    session.role === "SUPER_ADMIN" && sp.companyId ? sp.companyId : session.companyId;

  const technician = await prisma.user.findFirst({
    where: { id: technicianId, companyId, role: "TECHNICIAN" },
    select: { id: true, fullName: true, email: true },
  });

  if (!technician) notFound();

  const range = parseReportDateRange(sp.from, sp.to, sp.preset);
  const visits = await loadVisitsInRange(companyId, range, { technicianId });

  const alertVisits = visits.filter((v) => getVisitAlerts(v).length > 0);
  const poolIds = new Set(visits.map((v) => v.poolId));
  const avgCompleteness =
    visits.length === 0
      ? 0
      : Math.round(
          visits.reduce((sum, v) => sum + getVisitCompletenessPercent(v), 0) / visits.length,
        );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
            Report τεχνικου: {technician.fullName}
          </h1>
          <p className="text-sm text-zinc-600">{technician.email}</p>
        </div>
        <Link
          href={withCompanyQuery("/app/admin/reports", companyId, session.role, {
            tab: "technicians",
            from: range.fromStr,
            to: range.toStr,
          })}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 hover:bg-zinc-100"
        >
          Πισω στα Reports
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Επισκεψεις" value={String(visits.length)} />
        <Stat label="Διαφορετικες πισινες" value={String(poolIds.size)} />
        <Stat label="Επισκεψεις με alert" value={String(alertVisits.length)} />
        <Stat label="Μεσος ορος πληροτητας" value={`${avgCompleteness}%`} />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">
          Επισκεψεις ({range.fromStr} — {range.toStr})
        </h2>
        <div className="mt-4 space-y-2">
          {visits.length === 0 ? (
            <p className="text-zinc-600">Δεν υπαρχουν επισκεψεις στην περιοδο.</p>
          ) : (
            visits.map((visit) => {
              const alerts = getVisitAlerts(visit);
              const completeness = getVisitCompletenessPercent(visit);
              return (
                <Link
                  key={visit.id}
                  href={`/app/admin/visits/${visit.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 p-3 hover:bg-zinc-50"
                >
                  <div>
                    <p className="font-medium text-zinc-900">
                      {visit.pool.code} — {visit.pool.clientName}
                    </p>
                    <p className="text-sm text-zinc-600">
                      {new Date(visit.performedAt).toLocaleString("el-GR")} · Πληροτητα{" "}
                      {completeness}%
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
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
    </article>
  );
}
