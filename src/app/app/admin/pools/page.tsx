import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function createPool(formData: FormData) {
  "use server";

  const session = await requireAdminSession();
  const code = String(formData.get("code") ?? "").trim();
  const clientName = String(formData.get("clientName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const volumeLitersRaw = String(formData.get("volumeLiters") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!code || !clientName) return;

  await prisma.pool.create({
    data: {
      companyId: session.companyId,
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

export default async function AdminPoolsPage() {
  const session = await requireAdminSession();
  const pools = await prisma.pool.findMany({
    where: { companyId: session.companyId, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-3xl font-semibold text-zinc-900">Manage Pools</h1>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Add pool</h2>
        <form action={createPool} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            name="code"
            placeholder="Pool code (e.g. ALMA-01)"
            className="rounded-lg border border-zinc-300 px-3 py-2"
            required
          />
          <input
            name="clientName"
            placeholder="Client name"
            className="rounded-lg border border-zinc-300 px-3 py-2"
            required
          />
          <input
            name="address"
            placeholder="Address"
            className="rounded-lg border border-zinc-300 px-3 py-2 sm:col-span-2"
          />
          <input
            name="volumeLiters"
            type="number"
            min={0}
            placeholder="Volume (liters)"
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
          <input
            name="notes"
            placeholder="Notes"
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 sm:col-span-2"
          >
            Save pool
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Active pools ({pools.length})</h2>
        <div className="mt-4 space-y-3">
          {pools.length === 0 ? (
            <p className="text-zinc-600">No pools yet. Add your first one above.</p>
          ) : (
            pools.map((pool) => (
              <article key={pool.id} className="rounded-xl border border-zinc-200 p-4">
                <p className="font-semibold text-zinc-900">
                  {pool.code} - {pool.clientName}
                </p>
                <p className="text-sm text-zinc-600">{pool.address ?? "No address"}</p>
                <p className="text-sm text-zinc-600">
                  Volume: {pool.volumeLiters?.toLocaleString("el-GR") ?? "-"} L
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
