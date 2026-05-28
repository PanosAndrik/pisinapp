import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function parseOptionalDecimal(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

async function createVisit(formData: FormData) {
  "use server";

  const session = await requireSession();
  const poolId = String(formData.get("poolId") ?? "").trim();
  const performedAtRaw = String(formData.get("performedAt") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!poolId || !performedAtRaw) return;

  await prisma.visit.create({
    data: {
      companyId: session.companyId,
      poolId,
      technicianId: session.userId,
      performedAt: new Date(performedAtRaw),
      ph: parseOptionalDecimal(formData.get("ph")),
      chlorinePpm: parseOptionalDecimal(formData.get("chlorinePpm")),
      alkalinityPpm: parseOptionalDecimal(formData.get("alkalinityPpm")),
      temperatureC: parseOptionalDecimal(formData.get("temperatureC")),
      pressureBar: parseOptionalDecimal(formData.get("pressureBar")),
      notes: notes || null,
    },
  });

  revalidatePath("/app/technician/visits");
  revalidatePath("/app/technician");
}

export default async function TechnicianVisitsPage() {
  const session = await requireSession();
  const [pools, visits] = await Promise.all([
    prisma.pool.findMany({
      where: { companyId: session.companyId, isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, clientName: true },
    }),
    prisma.visit.findMany({
      where:
        session.role === "TECHNICIAN"
          ? { companyId: session.companyId, technicianId: session.userId }
          : { companyId: session.companyId },
      orderBy: { performedAt: "desc" },
      take: 30,
      include: { pool: { select: { code: true, clientName: true } } },
    }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-3xl font-semibold text-zinc-900">Record Visit</h1>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        {pools.length === 0 ? (
          <p className="text-zinc-600">No pools available yet.</p>
        ) : (
          <form action={createVisit} className="grid gap-3 sm:grid-cols-2">
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
        <h2 className="text-xl font-semibold text-zinc-900">My recent visits</h2>
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
                <p className="mt-1 text-sm text-zinc-700">{visit.notes ?? "No notes"}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
