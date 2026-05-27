import Link from "next/link";

import { ensureDefaultCompany } from "@/lib/app-context";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const company = await ensureDefaultCompany();
  const [poolCount, visitCount, recentVisits] = await Promise.all([
    prisma.pool.count({ where: { companyId: company.id, isActive: true } }),
    prisma.visit.count({ where: { companyId: company.id } }),
    prisma.visit.findMany({
      where: { companyId: company.id },
      orderBy: { performedAt: "desc" },
      take: 5,
      include: { pool: { select: { code: true, clientName: true } } },
    }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-zinc-900">Pisinapp Dashboard</h1>
        <p className="mt-2 text-zinc-600">
          Company: <span className="font-medium text-zinc-900">{company.name}</span>
        </p>
      </header>

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
          href="/pools"
          className="rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-sm transition hover:border-zinc-300"
        >
          <h2 className="text-xl font-semibold">Manage Pools</h2>
          <p className="mt-1 text-zinc-600">Add pools and see all active maintenance contracts.</p>
        </Link>
        <Link
          href="/visits"
          className="rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-sm transition hover:border-zinc-300"
        >
          <h2 className="text-xl font-semibold">Record Visit</h2>
          <p className="mt-1 text-zinc-600">Create service reports with water measurements.</p>
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
