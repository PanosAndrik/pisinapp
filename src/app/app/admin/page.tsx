import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { cardClass } from "@/components/ui/field-styles";
import { adminHref } from "@/lib/admin-nav";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AdminDashboardPageProps = {
  searchParams: Promise<{ companyId?: string }>;
};

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const selectedCompanyId =
    session.role === "SUPER_ADMIN" && params.companyId ? params.companyId : session.companyId;

  if (session.role === "SUPER_ADMIN" && !params.companyId) {
    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
      include: {
        users: {
          where: { isActive: true, role: "ADMIN" },
          orderBy: { fullName: "asc" },
          select: { id: true, fullName: true, email: true },
        },
        _count: { select: { pools: true, visits: true } },
      },
    });

    return (
      <PageShell>
        <PageHeader
          title="Επισκοπηση Εταιρειων"
          subtitle="Επελεξε εταιρεια για τα admin εργαλεια του boss."
          backHref="/app/super-admin"
          backLabel="Πισω στην Υπερ Διαχειριση"
        />

        <section className="space-y-4">
          {companies.map((company) => (
            <article key={company.id} className={cardClass}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900">{company.name}</h2>
                  <p className="text-sm text-zinc-600">
                    Πισινες: {company._count.pools} | Επισκεψεις: {company._count.visits}
                  </p>
                </div>
                <Link
                  href={`/app/admin?companyId=${company.id}`}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                >
                  Ανοιγμα Admin Προβολης
                </Link>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Λογαριασμοι Boss</h3>
                <div className="mt-2 space-y-2">
                  {company.users.length === 0 ? (
                    <p className="text-sm text-zinc-600">Δεν υπαρχει boss ακομα.</p>
                  ) : (
                    company.users.map((boss) => (
                      <div key={boss.id} className="rounded-lg border border-zinc-200 px-3 py-2">
                        <p className="text-sm font-medium text-zinc-900">{boss.fullName}</p>
                        <p className="text-xs text-zinc-600">{boss.email}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      </PageShell>
    );
  }

  const [poolCount, visitCount, recentVisits] = await Promise.all([
    prisma.pool.count({ where: { companyId: selectedCompanyId, isActive: true } }),
    prisma.visit.count({ where: { companyId: selectedCompanyId } }),
    prisma.visit.findMany({
      where: { companyId: selectedCompanyId },
      orderBy: { performedAt: "desc" },
      take: 5,
      include: { pool: { select: { code: true, clientName: true } } },
    }),
  ]);

  const isSuperAdmin = session.role === "SUPER_ADMIN";

  return (
    <PageShell>
      <PageHeader
        title="Πινακας Admin"
        backHref={isSuperAdmin ? "/app/admin" : undefined}
        backLabel="Πισω στις εταιρειες"
      />
      <section className="grid gap-4 sm:grid-cols-2">
        <article className={`${cardClass} p-5`}>
          <p className="text-sm text-zinc-500">Ενεργες πισινες</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900">{poolCount}</p>
        </article>
        <article className={`${cardClass} p-5`}>
          <p className="text-sm text-zinc-500">Συνολικες επισκεψεις</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900">{visitCount}</p>
        </article>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href={adminHref("/app/admin/pools", { companyId: selectedCompanyId, isSuperAdmin })}
          className={`${cardClass} block p-5 text-zinc-900 transition active:border-zinc-300`}
        >
          <h2 className="text-xl font-semibold">Διαχειριση Πισινων</h2>
          <p className="mt-1 text-zinc-600">Δημιουργια και διαχειριση πισινων της εταιρειας.</p>
        </Link>
        <Link
          href={adminHref("/app/admin/visits", { companyId: selectedCompanyId, isSuperAdmin })}
          className={`${cardClass} block p-5 text-zinc-900 transition active:border-zinc-300`}
        >
          <h2 className="text-xl font-semibold">Αναφορες Επισκεψεων</h2>
          <p className="mt-1 text-zinc-600">Λιστα επισκεψεων και λεπτομερειες.</p>
        </Link>
        <Link
          href={adminHref("/app/admin/reports", { companyId: selectedCompanyId, isSuperAdmin })}
          className={`${cardClass} block p-5 text-zinc-900 transition active:border-zinc-300 sm:col-span-2`}
        >
          <h2 className="text-xl font-semibold">Reports & Στατιστικα</h2>
          <p className="mt-1 text-zinc-600">
            Alerts, trends, αναλυτικα ανα πισινα και τεχνικο, εξαγωγη CSV.
          </p>
        </Link>
        <Link
          href={adminHref("/app/admin/team", { companyId: selectedCompanyId, isSuperAdmin })}
          className={`${cardClass} block p-5 text-zinc-900 transition active:border-zinc-300`}
        >
          <h2 className="text-xl font-semibold">Διαχειριση Ομαδας</h2>
          <p className="mt-1 text-zinc-600">Διαχειριση λογαριασμων boss και τεχνικων.</p>
        </Link>
      </section>

      <section className={cardClass}>
        <h2 className="text-xl font-semibold text-zinc-900">Τελευταιες επισκεψεις</h2>
        <div className="mt-4 space-y-3">
          {recentVisits.length === 0 ? (
            <p className="text-zinc-600">Δεν υπαρχουν επισκεψεις ακομα.</p>
          ) : (
            recentVisits.map((visit) => (
              <div key={visit.id} className="rounded-xl border border-zinc-200 p-3">
                <p className="font-medium text-zinc-900">
                  {visit.pool.code} - {visit.pool.clientName}
                </p>
                <p className="text-sm text-zinc-600">
                  {new Date(visit.performedAt).toLocaleString("el-GR")}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </PageShell>
  );
}
