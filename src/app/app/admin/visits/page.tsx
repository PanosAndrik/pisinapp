import Link from "next/link";

import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AdminVisitsPageProps = {
  searchParams: Promise<{ companyId?: string }>;
};

export default async function AdminVisitsPage({ searchParams }: AdminVisitsPageProps) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const companyId =
    session.role === "SUPER_ADMIN" && params.companyId ? params.companyId : session.companyId;
  const visits = await prisma.visit.findMany({
      where: { companyId },
      orderBy: { performedAt: "desc" },
      take: 30,
      include: {
        pool: { select: { code: true, clientName: true } },
        technician: { select: { fullName: true, email: true } },
      },
    });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-3xl font-semibold text-zinc-900">Αναφορες Επισκεψεων</h1>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Καταχωρηση Νεας Επισκεψης</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Η λεπτομερης φορμα επισκεψης (ιδια με του τεχνικου) βρισκεται εδω:
        </p>
        <Link
          href={
            session.role === "SUPER_ADMIN"
              ? `/app/technician/visits?companyId=${companyId}`
              : "/app/technician/visits"
          }
          className="mt-3 inline-flex rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Ανοιγμα πληρους φορμας επισκεψης
        </Link>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Τελευταιες επισκεψεις</h2>
        <div className="mt-4 space-y-3">
          {visits.length === 0 ? (
            <p className="text-zinc-600">Δεν υπαρχουν επισκεψεις ακομα.</p>
          ) : (
            visits.map((visit) => (
              <Link
                key={visit.id}
                href={`/app/admin/visits/${visit.id}`}
                className="block rounded-xl border border-zinc-200 p-4 transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                <p className="font-semibold text-zinc-900">
                  {visit.pool.code} - {visit.pool.clientName}
                </p>
                <p className="text-sm text-zinc-600">
                  {new Date(visit.performedAt).toLocaleString("el-GR")}
                </p>
                <p className="mt-1 text-sm text-zinc-700">
                  Τεχνικος: {visit.technician?.fullName ?? "Δεν δηλωθηκε"}
                </p>
                <p className="mt-1 text-sm text-zinc-500">Πατα για αναλυτικη προβολη</p>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
