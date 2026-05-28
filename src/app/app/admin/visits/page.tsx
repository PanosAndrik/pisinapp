import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/auth";
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

  const session = await requireAdminSession();
  const targetCompanyIdRaw = String(formData.get("companyId") ?? "").trim();
  const companyId =
    session.role === "SUPER_ADMIN" && targetCompanyIdRaw ? targetCompanyIdRaw : session.companyId;
  const poolId = String(formData.get("poolId") ?? "").trim();
  const performedAtRaw = String(formData.get("performedAt") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!poolId || !performedAtRaw) return;

  await prisma.visit.create({
    data: {
      companyId,
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

  revalidatePath("/app/admin/visits");
  revalidatePath("/app/admin");
}

type AdminVisitsPageProps = {
  searchParams: Promise<{ companyId?: string }>;
};

export default async function AdminVisitsPage({ searchParams }: AdminVisitsPageProps) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const companyId =
    session.role === "SUPER_ADMIN" && params.companyId ? params.companyId : session.companyId;
  const [pools, visits] = await Promise.all([
    prisma.pool.findMany({
      where: { companyId, isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, clientName: true },
    }),
    prisma.visit.findMany({
      where: { companyId },
      orderBy: { performedAt: "desc" },
      take: 30,
      include: { pool: { select: { code: true, clientName: true } } },
    }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-3xl font-semibold text-zinc-900">Αναφορες Επισκεψεων</h1>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Καταχωρηση Νεας Επισκεψης</h2>
        {pools.length === 0 ? (
          <p className="mt-3 text-zinc-600">Πρεπει να υπαρχει τουλαχιστον μια πισινα πρωτα.</p>
        ) : (
          <form action={createVisit} className="mt-4 grid gap-3 sm:grid-cols-2">
            {session.role === "SUPER_ADMIN" ? (
              <input type="hidden" name="companyId" value={companyId} />
            ) : null}
            <select name="poolId" className="rounded-lg border border-zinc-300 px-3 py-2" required>
              <option value="">Επιλογη πισινας</option>
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
              placeholder="Χλωριο ppm"
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
            <input
              name="alkalinityPpm"
              type="number"
              step="0.01"
              placeholder="Αλκαλικοτητα ppm"
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
            <input
              name="temperatureC"
              type="number"
              step="0.1"
              placeholder="Θερμοκρασια C"
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
            <input
              name="pressureBar"
              type="number"
              step="0.01"
              placeholder="Πιεση φιλτρου bar"
              className="rounded-lg border border-zinc-300 px-3 py-2"
            />
            <input
              name="notes"
              placeholder="Παρατηρησεις"
              className="rounded-lg border border-zinc-300 px-3 py-2 sm:col-span-2"
            />
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 sm:col-span-2"
            >
              Αποθηκευση επισκεψης
            </button>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Τελευταιες επισκεψεις</h2>
        <div className="mt-4 space-y-3">
          {visits.length === 0 ? (
            <p className="text-zinc-600">Δεν υπαρχουν επισκεψεις ακομα.</p>
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
                  Θερμοκρασια: {visit.temperatureC?.toString() ?? "-"} C | Πιεση:{" "}
                  {visit.pressureBar?.toString() ?? "-"} bar
                </p>
                <p className="mt-1 text-sm text-zinc-600">{visit.notes ?? "Χωρις παρατηρησεις"}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
