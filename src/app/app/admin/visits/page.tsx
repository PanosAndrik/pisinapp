import Link from "next/link";

import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { btnPrimaryClass, cardClass } from "@/components/ui/field-styles";
import { adminHref } from "@/lib/admin-nav";
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

  const isSuperAdmin = session.role === "SUPER_ADMIN";

  return (
    <PageShell>
      <PageHeader
        title="Αναφορες Επισκεψεων"
        backHref={adminHref("/app/admin", { companyId, isSuperAdmin })}
        backLabel="Πισω στο Admin"
      />

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-zinc-900 sm:text-xl">Καταχωρηση Νεας Επισκεψης</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Η λεπτομερης φορμα επισκεψης (ιδια με του τεχνικου) βρισκεται εδω:
        </p>
        <Link
          href={adminHref("/app/technician/visits", { companyId, isSuperAdmin })}
          className={`${btnPrimaryClass} mt-3 inline-flex w-auto items-center justify-center px-5`}
        >
          Ανοιγμα πληρους φορμας επισκεψης
        </Link>
      </section>

      <section className={cardClass}>
        <h2 className="text-xl font-semibold text-zinc-900">Τελευταιες επισκεψεις</h2>
        <div className="mt-4 space-y-3">
          {visits.length === 0 ? (
            <p className="text-zinc-600">Δεν υπαρχουν επισκεψεις ακομα.</p>
          ) : (
            visits.map((visit) => (
              <Link
                key={visit.id}
                href={`/app/admin/visits/${visit.id}`}
                className="block min-h-[4.5rem] rounded-xl border border-zinc-200 p-4 active:border-zinc-300 active:bg-zinc-50"
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
    </PageShell>
  );
}
