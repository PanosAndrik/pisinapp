import Link from "next/link";
import { revalidatePath } from "next/cache";

import { ensureDefaultCompany } from "@/lib/app-context";
import { prisma } from "@/lib/prisma";

async function createPool(formData: FormData) {
  "use server";

  const company = await ensureDefaultCompany();
  const code = String(formData.get("code") ?? "").trim();
  const clientName = String(formData.get("clientName") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const volumeLitersRaw = String(formData.get("volumeLiters") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!code || !clientName) return;

  await prisma.pool.create({
    data: {
      companyId: company.id,
      code,
      clientName,
      address: address || null,
      volumeLiters: volumeLitersRaw ? Number(volumeLitersRaw) : null,
      notes: notes || null,
    },
  });

  revalidatePath("/pools");
  revalidatePath("/");
}

export default async function PoolsPage() {
  const company = await ensureDefaultCompany();
  const pools = await prisma.pool.findMany({
    where: { companyId: company.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-zinc-900">Pools</h1>
        <Link href="/" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
          Back to dashboard
        </Link>
      </div>

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
