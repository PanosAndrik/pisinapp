import Link from "next/link";
import { revalidatePath } from "next/cache";

import { ensureDefaultCompany } from "@/lib/app-context";
import { prisma } from "@/lib/prisma";

function parseOptionalDecimal(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

async function createVisit(formData: FormData) {
  "use server";

  const company = await ensureDefaultCompany();
  const poolId = String(formData.get("poolId") ?? "").trim();
  const performedAtRaw = String(formData.get("performedAt") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!poolId || !performedAtRaw) return;

  await prisma.visit.create({
    data: {
      companyId: company.id,
      poolId,
      performedAt: new Date(performedAtRaw),
      ph: parseOptionalDecimal(formData.get("ph")),
      chlorinePpm: parseOptionalDecimal(formData.get("chlorinePpm")),
      alkalinityPpm: parseOptionalDecimal(formData.get("alkalinityPpm")),
      temperatureC: parseOptionalDecimal(formData.get("temperatureC")),
      pressureBar: parseOptionalDecimal(formData.get("pressureBar")),
      notes: notes || null,
    },
  });

  revalidatePath("/visits");
  revalidatePath("/");
}

export default async function VisitsPage() {
  const company = await ensureDefaultCompany();
  const [pools, visits] = await Promise.all([
    prisma.pool.findMany({
      where: { companyId: company.id, isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, clientName: true },
    }),
    prisma.visit.findMany({
      where: { companyId: company.id },
      orderBy: { performedAt: "desc" },
      take: 20,
      include: { pool: { select: { code: true, clientName: true } } },
    }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-zinc-900">Visit reports</h1>
        <Link href="/" className="text-sm font-medium text-zinc-700 hover:text-zinc-900">
          Back to dashboard
        </Link>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Record new visit</h2>
        {pools.length === 0 ? (
          <p className="mt-3 text-zinc-600">Create at least one pool first.</p>
        ) : (
          <form action={createVisit} className="mt-4 grid gap-3 sm:grid-cols-2">
            <select name="poolId" className="rounded-lg border border-zinc-300 px-3 py-2" required>
              <option value="">Select pool</option>
              {pools.map((pool) => (
                <option key={pool.id} value={pool.id}>
                  {pool.code} - {pool.clientName}
                </option>
              ))}
            </select>
            <input
              name="performedAt"
              type="datetime-local"
              className="rounded-lg border border-zinc-300 px-3 py-2"
              required
            />
            <input
              name="ph"
              type="number"
              step="0.01"
              placeholder="pH"
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
            <input
              name="chlorinePpm"
              type="number"
              step="0.01"
              placeholder="Chlorine ppm"
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
            <input
              name="alkalinityPpm"
              type="number"
              step="0.01"
              placeholder="Alkalinity ppm"
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
            <input
              name="temperatureC"
              type="number"
              step="0.1"
              placeholder="Temperature C"
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
            <input
              name="pressureBar"
              type="number"
              step="0.01"
              placeholder="Filter pressure bar"
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
            <input
              name="notes"
              placeholder="Notes"
              className="rounded-lg border border-zinc-300 px-3 py-2 sm:col-span-2"
            />
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 sm:col-span-2"
            >
              Save visit
            </button>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Recent visits</h2>
        <div className="mt-4 space-y-3">
          {visits.length === 0 ? (
            <p className="text-zinc-600">No visits yet.</p>
          ) : (
            visits.map((visit) => (
              <article key={visit.id} className="rounded-xl border border-zinc-200 p-4">
                <p className="font-semibold text-zinc-900">
                  {visit.pool.code} - {visit.pool.clientName}
                </p>
                <p className="text-sm text-zinc-600">
                  {new Date(visit.performedAt).toLocaleString("el-GR")}
                </p>
                <p className="mt-2 text-sm text-zinc-700">
                  pH: {visit.ph?.toString() ?? "-"} | Cl: {visit.chlorinePpm?.toString() ?? "-"} ppm |
                  Alkalinity: {visit.alkalinityPpm?.toString() ?? "-"} ppm
                </p>
                <p className="text-sm text-zinc-700">
                  Temp: {visit.temperatureC?.toString() ?? "-"} C | Pressure:{" "}
                  {visit.pressureBar?.toString() ?? "-"} bar
                </p>
                <p className="mt-1 text-sm text-zinc-600">{visit.notes ?? "No notes"}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
