import Link from "next/link";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TechnicianDashboardPage() {
  const session = await requireSession();

  const recentVisits = await prisma.visit.findMany({
    where:
      session.role === "TECHNICIAN"
        ? { companyId: session.companyId, technicianId: session.userId }
        : { companyId: session.companyId },
    orderBy: { performedAt: "desc" },
    take: 10,
    include: { pool: { select: { code: true, clientName: true } } },
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-3xl font-semibold text-zinc-900">Technician Panel</h1>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/app/technician/visits"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Record visit
          </Link>
          {session.role === "ADMIN" || session.role === "SUPER_ADMIN" ? (
            <Link
              href="/app/admin/pools"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
            >
              View pools
            </Link>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Recent visits</h2>
        <div className="mt-4 space-y-3">
          {recentVisits.length === 0 ? (
            <p className="text-zinc-600">No visits yet.</p>
          ) : (
            recentVisits.map((visit) => (
              <article key={visit.id} className="rounded-xl border border-zinc-200 p-4">
                <p className="font-semibold text-zinc-900">
                  {visit.pool.code} - {visit.pool.clientName}
                </p>
                <p className="text-sm text-zinc-600">
                  {new Date(visit.performedAt).toLocaleString("el-GR")}
                </p>
                <p className="mt-1 text-sm text-zinc-700">{visit.notes ?? "No notes"}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
