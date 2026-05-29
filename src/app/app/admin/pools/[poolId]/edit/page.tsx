import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { btnPrimaryClass, cardClass, fieldClass } from "@/components/ui/field-styles";
import { adminHref } from "@/lib/admin-nav";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PoolEditPageProps = {
  params: Promise<{ poolId: string }>;
  searchParams: Promise<{ companyId?: string }>;
};

async function updatePool(formData: FormData) {
  "use server";

  const session = await requireAdminSession();
  const poolId = String(formData.get("poolId") ?? "").trim();
  if (!poolId) return;

  const targetCompanyIdRaw = String(formData.get("companyId") ?? "").trim();
  const companyId =
    session.role === "SUPER_ADMIN" && targetCompanyIdRaw ? targetCompanyIdRaw : session.companyId;

  const code = String(formData.get("code") ?? "").trim();
  const clientName = String(formData.get("clientName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const volumeLitersRaw = String(formData.get("volumeLiters") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!code || !clientName) return;

  const existing = await prisma.pool.findFirst({
    where: { id: poolId, companyId },
    select: { id: true },
  });
  if (!existing) return;

  await prisma.pool.update({
    where: { id: poolId },
    data: {
      code,
      clientName,
      address: address || null,
      volumeLiters: volumeLitersRaw ? Number(volumeLitersRaw) : null,
      notes: notes || null,
    },
  });

  revalidatePath("/app/admin/pools");
  revalidatePath("/app/admin");
  revalidatePath(`/app/admin/pools/${poolId}`);

  redirect(
    adminHref(`/app/admin/pools/${poolId}`, {
      companyId,
      isSuperAdmin: session.role === "SUPER_ADMIN",
    }),
  );
}

export default async function PoolEditPage({ params, searchParams }: PoolEditPageProps) {
  const session = await requireAdminSession();
  const { poolId } = await params;
  const sp = await searchParams;

  const companyId =
    session.role === "SUPER_ADMIN" && sp.companyId ? sp.companyId : session.companyId;
  const isSuperAdmin = session.role === "SUPER_ADMIN";

  const pool = await prisma.pool.findFirst({
    where: { id: poolId, companyId },
    select: { id: true, code: true, clientName: true, address: true, volumeLiters: true, notes: true },
  });

  if (!pool) notFound();

  const detailHref = adminHref(`/app/admin/pools/${pool.id}`, { companyId, isSuperAdmin });
  const listHref = adminHref("/app/admin/pools", { companyId, isSuperAdmin });

  return (
    <PageShell>
      <PageHeader
        title={`Επεξεργασια: ${pool.code}`}
        backHref={listHref}
        backLabel="Πισω στις πισινες"
        actions={
          <Link href={detailHref} className="touch-target inline-flex items-center justify-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100">
            Πισω στο προφιλ
          </Link>
        }
      />

      <section className={cardClass}>
        <h2 className="text-lg font-semibold text-zinc-900">Στοιχεια πισινας</h2>

        <form action={updatePool} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="poolId" value={pool.id} />
          {isSuperAdmin ? <input type="hidden" name="companyId" value={companyId} /> : null}

          <input name="code" defaultValue={pool.code} placeholder="Κωδικος πισινας" className={fieldClass} required />
          <input name="clientName" defaultValue={pool.clientName} placeholder="Ονομα πελατη" className={fieldClass} required />

          <input
            name="address"
            defaultValue={pool.address ?? ""}
            placeholder="Διευθυνση"
            className={`${fieldClass} sm:col-span-2`}
          />

          <input
            name="volumeLiters"
            type="number"
            min={0}
            defaultValue={pool.volumeLiters ?? undefined}
            placeholder="Ογκος (λιτρα)"
            className={fieldClass}
          />

          <textarea
            name="notes"
            defaultValue={pool.notes ?? ""}
            placeholder="Παρατηρησεις"
            rows={4}
            className={`${fieldClass} sm:col-span-1`}
          />

          <div className="sm:col-span-2">
            <button type="submit" className={btnPrimaryClass}>
              Αποθηκευση αλλαγων
            </button>
          </div>
        </form>
      </section>
    </PageShell>
  );
}

