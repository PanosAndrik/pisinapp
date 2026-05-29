import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { btnPrimaryClass, cardClass } from "@/components/ui/field-styles";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type TechnicianDashboardPageProps = {
  searchParams: Promise<{ companyId?: string }>;
};

export default async function TechnicianDashboardPage({ searchParams }: TechnicianDashboardPageProps) {
  const session = await requireSession();
  const params = await searchParams;

  if (session.role === "SUPER_ADMIN" && !params.companyId) {
    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
      include: {
        users: {
          where: { isActive: true, role: { in: ["ADMIN", "TECHNICIAN"] } },
          orderBy: [{ role: "asc" }, { fullName: "asc" }],
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });

    return (
      <PageShell>
        <PageHeader
          title="Δομη Τεχνικων"
          subtitle="Δες για καθε εταιρεια τον boss και τους τεχνικους του."
          backHref="/app"
          backLabel="Πισω"
        />

        <section className="space-y-4">
          {companies.map((company) => {
            const bosses = company.users.filter((u) => u.role === "ADMIN");
            const technicians = company.users.filter((u) => u.role === "TECHNICIAN");
            return (
              <article key={company.id} className={cardClass}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-zinc-900">{company.name}</h2>
                  <Link
                    href={`/app/technician?companyId=${company.id}`}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 hover:bg-zinc-100"
                  >
                    Ανοιγμα επισκεψεων
                  </Link>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Bosses</h3>
                    <div className="mt-2 space-y-2">
                      {bosses.length === 0 ? (
                        <p className="text-sm text-zinc-600">Δεν υπαρχει boss ακομα.</p>
                      ) : (
                        bosses.map((boss) => (
                          <div key={boss.id} className="rounded-lg border border-zinc-200 px-3 py-2">
                            <p className="text-sm font-medium text-zinc-900">{boss.fullName}</p>
                            <p className="text-xs text-zinc-600">{boss.email}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Technicians</h3>
                    <div className="mt-2 space-y-2">
                      {technicians.length === 0 ? (
                        <p className="text-sm text-zinc-600">Δεν υπαρχουν τεχνικοι ακομα.</p>
                      ) : (
                        technicians.map((tech) => (
                          <div key={tech.id} className="rounded-lg border border-zinc-200 px-3 py-2">
                            <p className="text-sm font-medium text-zinc-900">{tech.fullName}</p>
                            <p className="text-xs text-zinc-600">{tech.email}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </PageShell>
    );
  }

  const selectedCompanyId =
    session.role === "SUPER_ADMIN" && params.companyId ? params.companyId : session.companyId;

  const recentVisits = await prisma.visit.findMany({
    where:
      session.role === "TECHNICIAN"
        ? { companyId: selectedCompanyId, technicianId: session.userId }
        : { companyId: selectedCompanyId },
    orderBy: { performedAt: "desc" },
    take: 10,
    include: { pool: { select: { code: true, clientName: true } } },
  });

  const visitsHref =
    session.role === "SUPER_ADMIN" && params.companyId
      ? `/app/technician/visits?companyId=${params.companyId}`
      : "/app/technician/visits";

  return (
    <PageShell>
      <PageHeader
        title="Πινακας Τεχνικου"
        backHref={session.role === "SUPER_ADMIN" ? "/app/technician" : undefined}
        backLabel="Πισω"
      />

      <section className={cardClass}>
        <h2 className="text-xl font-semibold text-zinc-900">Γρηγορες ενεργειες</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href={visitsHref} className={`${btnPrimaryClass} inline-flex w-full sm:w-auto`}>
            Καταχωρηση επισκεψης
          </Link>
          {session.role === "ADMIN" || session.role === "SUPER_ADMIN" ? (
            <Link
              href="/app/admin/pools"
              className="touch-target inline-flex w-full items-center justify-center rounded-lg border border-zinc-300 px-4 py-3 text-base font-medium text-zinc-900 hover:bg-zinc-100 sm:w-auto sm:py-2 sm:text-sm"
            >
              Προβολη πισινων
            </Link>
          ) : null}
        </div>
      </section>

      <section className={cardClass}>
        <h2 className="text-xl font-semibold text-zinc-900">Τελευταιες επισκεψεις</h2>
        <div className="mt-4 space-y-3">
          {recentVisits.length === 0 ? (
            <p className="text-zinc-600">Δεν υπαρχουν επισκεψεις ακομα.</p>
          ) : (
            recentVisits.map((visit) => (
              <article key={visit.id} className="rounded-xl border border-zinc-200 p-4">
                <p className="font-semibold text-zinc-900">
                  {visit.pool.code} - {visit.pool.clientName}
                </p>
                <p className="text-sm text-zinc-600">
                  {new Date(visit.performedAt).toLocaleString("el-GR")}
                </p>
                <p className="mt-1 text-sm text-zinc-700">{visit.notes ?? "Χωρις παρατηρησεις"}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </PageShell>
  );
}
