import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { btnPrimaryClass, cardClass, fieldClass } from "@/components/ui/field-styles";
import { SeverityBadge } from "@/components/reports/severity-badge";
import { adminHref } from "@/lib/admin-nav";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadPoolAlertRows } from "@/lib/reports/data";

export const dynamic = "force-dynamic";

async function createPool(formData: FormData) {
  "use server";

  const session = await requireAdminSession();
  const targetCompanyIdRaw = String(formData.get("companyId") ?? "").trim();
  const companyId =
    session.role === "SUPER_ADMIN" && targetCompanyIdRaw ? targetCompanyIdRaw : session.companyId;
  const code = String(formData.get("code") ?? "").trim();
  const clientName = String(formData.get("clientName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const volumeLitersRaw = String(formData.get("volumeLiters") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!code || !clientName) return;

  await prisma.pool.create({
    data: {
      companyId,
      code,
      clientName,
      address: address || null,
      volumeLiters: volumeLitersRaw ? Number(volumeLitersRaw) : null,
      notes: notes || null,
    },
  });

  revalidatePath("/app/admin/pools");
  revalidatePath("/app/admin");
}

async function deletePool(formData: FormData) {
  "use server";

  const session = await requireAdminSession();
  const poolId = String(formData.get("poolId") ?? "").trim();
  if (!poolId) return;

  const targetCompanyIdRaw = String(formData.get("companyId") ?? "").trim();
  const companyId =
    session.role === "SUPER_ADMIN" && targetCompanyIdRaw ? targetCompanyIdRaw : session.companyId;

  const existing = await prisma.pool.findFirst({
    where: { id: poolId, companyId },
    select: { id: true },
  });
  if (!existing) return;

  await prisma.pool.update({
    where: { id: poolId },
    data: { isActive: false },
  });

  revalidatePath("/app/admin/pools");
  revalidatePath("/app/admin");

  redirect(adminHref("/app/admin/pools", { companyId, isSuperAdmin: session.role === "SUPER_ADMIN" }));
}

type AdminPoolsPageProps = {
  searchParams: Promise<{ companyId?: string }>;
};

export default async function AdminPoolsPage({ searchParams }: AdminPoolsPageProps) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const companyId =
    session.role === "SUPER_ADMIN" && params.companyId ? params.companyId : session.companyId;
  const pools = await prisma.pool.findMany({
    where: { companyId, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const isSuperAdmin = session.role === "SUPER_ADMIN";
  const poolAlerts = await loadPoolAlertRows(companyId);

  return (
    <PageShell>
      <PageHeader
        title="Διαχειριση Πισινων"
        backHref={adminHref("/app/admin", { companyId, isSuperAdmin })}
        backLabel="Πισω στο Admin"
      />
      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-zinc-900 sm:text-xl">Προσθηκη Πισινας</h2>
        <form action={createPool} className="mt-4 grid gap-3 sm:grid-cols-2">
          {isSuperAdmin ? <input type="hidden" name="companyId" value={companyId} /> : null}
          <input name="code" placeholder="Κωδικος πισινας (π.χ. ALMA-01)" className={fieldClass} required />
          <input name="clientName" placeholder="Ονομα πελατη" className={fieldClass} required />
          <input
            name="address"
            placeholder="Διευθυνση"
            className={`${fieldClass} sm:col-span-2`}
          />
          <input
            name="volumeLiters"
            type="number"
            min={0}
            placeholder="Ογκος (λιτρα)"
            className={fieldClass}
          />
          <input name="notes" placeholder="Παρατηρησεις" className={fieldClass} />
          <button type="submit" className={`${btnPrimaryClass} sm:col-span-2`}>
            Αποθηκευση πισινας
          </button>
        </form>
      </section>

      <section className={cardClass}>
        <h2 className="text-xl font-semibold text-zinc-900">Ενεργες πισινες ({pools.length})</h2>
        <div className="mt-4 space-y-3">
          {pools.length === 0 ? (
            <p className="text-zinc-600">Δεν υπαρχουν πισινες ακομα. Προσθεσε την πρωτη.</p>
          ) : (
            pools.map((pool) => (
              (() => {
                const row = poolAlerts.find((r) => r.poolId === pool.id) ?? null;
                const poolHref = adminHref(`/app/admin/pools/${pool.id}`, { companyId, isSuperAdmin });
                const editHref = adminHref(`/app/admin/pools/${pool.id}/edit`, {
                  companyId,
                  isSuperAdmin,
                });

                return (
                  <article
                    key={pool.id}
                    className="rounded-xl border border-zinc-200 p-4 transition hover:border-zinc-300 hover:bg-zinc-50"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <Link href={poolHref} className="block">
                          <p className="font-semibold text-zinc-900">
                            {pool.code} - {pool.clientName}
                          </p>
                        </Link>
                        <p className="text-sm text-zinc-600">{pool.address ?? "Χωρις διευθυνση"}</p>
                        <p className="text-sm text-zinc-600">
                          Ογκος: {pool.volumeLiters?.toLocaleString("el-GR") ?? "-"} L
                        </p>
                        <div className="mt-1 text-xs text-zinc-500">
                          Τελευταία επίσκεψη:{" "}
                          {row?.lastVisitAt ? new Date(row.lastVisitAt).toLocaleDateString("el-GR") : "—"}
                          {row?.daysWithoutVisit != null ? ` · ${row.daysWithoutVisit} ημερες` : ""}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {row?.alerts.length ? (
                            row.alerts.slice(0, 2).map((a, i) => (
                              <SeverityBadge key={`${pool.id}-a-${i}`} severity={a.severity} />
                            ))
                          ) : (
                            <span className="text-xs font-medium text-emerald-700">OK</span>
                          )}
                          {row?.alerts.length && row.alerts.length > 2 ? (
                            <span className="text-xs text-zinc-500">+{row.alerts.length - 2}</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={editHref}
                          className="touch-target inline-flex items-center justify-center rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
                        >
                          Edit
                        </Link>

                        <form action={deletePool} className="contents">
                          <input type="hidden" name="poolId" value={pool.id} />
                          {isSuperAdmin ? <input type="hidden" name="companyId" value={companyId} /> : null}
                          <button
                            type="submit"
                            className="touch-target inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                  </article>
                );
              })()
            ))
          )}
        </div>
      </section>
    </PageShell>
  );
}
