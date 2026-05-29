import { revalidatePath } from "next/cache";

import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { btnPrimaryClass, cardClass, fieldClass } from "@/components/ui/field-styles";
import { adminHref } from "@/lib/admin-nav";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
              <article key={pool.id} className="rounded-xl border border-zinc-200 p-4">
                <p className="font-semibold text-zinc-900">
                  {pool.code} - {pool.clientName}
                </p>
                <p className="text-sm text-zinc-600">{pool.address ?? "Χωρις διευθυνση"}</p>
                <p className="text-sm text-zinc-600">
                  Ογκος: {pool.volumeLiters?.toLocaleString("el-GR") ?? "-"} L
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </PageShell>
  );
}
