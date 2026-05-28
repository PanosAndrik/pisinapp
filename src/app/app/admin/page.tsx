import Link from "next/link";

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
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
        <h1 className="text-3xl font-semibold text-zinc-900">Admin Companies Overview</h1>
        <p className="text-zinc-600">
          Select a company boss to open the same admin controls they use.
        </p>

        <section className="space-y-4">
          {companies.map((company) => (
            <article key={company.id} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900">{company.name}</h2>
                  <p className="text-sm text-zinc-600">
                    Pools: {company._count.pools} | Visits: {company._count.visits}
                  </p>
                </div>
                <Link
                  href={`/app/admin?companyId=${company.id}`}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                >
                  Open Admin View
                </Link>
              </div>
              <div className="mt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Boss accounts</h3>
                <div className="mt-2 space-y-2">
                  {company.users.length === 0 ? (
                    <p className="text-sm text-zinc-600">No boss assigned yet.</p>
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
      </main>
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

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-3xl font-semibold text-zinc-900">Admin Dashboard</h1>
      {session.role === "SUPER_ADMIN" ? (
        <div className="flex gap-3">
          <Link
            href="/app/admin"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 hover:bg-zinc-100"
          >
            Back to all bosses
          </Link>
        </div>
      ) : null}
      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Active pools</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900">{poolCount}</p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Total visits</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900">{visitCount}</p>
        </article>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href={
            session.role === "SUPER_ADMIN"
              ? `/app/admin/pools?companyId=${selectedCompanyId}`
              : "/app/admin/pools"
          }
          className="rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-sm transition hover:border-zinc-300"
        >
          <h2 className="text-xl font-semibold">Manage Pools</h2>
          <p className="mt-1 text-zinc-600">Create and manage all pools for this company.</p>
        </Link>
        <Link
          href={
            session.role === "SUPER_ADMIN"
              ? `/app/admin/visits?companyId=${selectedCompanyId}`
              : "/app/admin/visits"
          }
          className="rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-sm transition hover:border-zinc-300"
        >
          <h2 className="text-xl font-semibold">Visit Reports</h2>
          <p className="mt-1 text-zinc-600">Review service reports and measurements.</p>
        </Link>
        <Link
          href={
            session.role === "SUPER_ADMIN"
              ? `/app/admin/team?companyId=${selectedCompanyId}`
              : "/app/admin/team"
          }
          className="rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-sm transition hover:border-zinc-300"
        >
          <h2 className="text-xl font-semibold">Team Management</h2>
          <p className="mt-1 text-zinc-600">Manage boss and technician accounts for this company.</p>
        </Link>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Recent visits</h2>
        <div className="mt-4 space-y-3">
          {recentVisits.length === 0 ? (
            <p className="text-zinc-600">No visits recorded yet.</p>
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
    </main>
  );
}
