import Link from "next/link";

import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();

  const [poolCount, visitCount, recentVisits] = await Promise.all([
    prisma.pool.count({ where: { companyId: session.companyId, isActive: true } }),
    prisma.visit.count({ where: { companyId: session.companyId } }),
    prisma.visit.findMany({
      where: { companyId: session.companyId },
      orderBy: { performedAt: "desc" },
      take: 5,
      include: { pool: { select: { code: true, clientName: true } } },
    }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-3xl font-semibold text-zinc-900">Admin Dashboard</h1>
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
          href="/app/admin/pools"
          className="rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-sm transition hover:border-zinc-300"
        >
          <h2 className="text-xl font-semibold">Manage Pools</h2>
          <p className="mt-1 text-zinc-600">Create and manage all pools for this company.</p>
        </Link>
        <Link
          href="/app/admin/visits"
          className="rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-sm transition hover:border-zinc-300"
        >
          <h2 className="text-xl font-semibold">Visit Reports</h2>
          <p className="mt-1 text-zinc-600">Review service reports and measurements.</p>
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
