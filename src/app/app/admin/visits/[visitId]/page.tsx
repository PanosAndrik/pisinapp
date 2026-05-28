import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type VisitDetailPageProps = {
  params: Promise<{ visitId: string }>;
};

function renderBoolean(value: unknown) {
  return value === true ? "Ναι" : "Οχι";
}

function renderRecord(value: unknown) {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>);
}

export default async function VisitDetailPage({ params }: VisitDetailPageProps) {
  const session = await requireAdminSession();
  const { visitId } = await params;

  const visit = await prisma.visit.findFirst({
    where:
      session.role === "SUPER_ADMIN"
        ? { id: visitId }
        : {
            id: visitId,
            companyId: session.companyId,
          },
    include: {
      pool: { select: { code: true, clientName: true } },
      technician: { select: { fullName: true, email: true } },
      photos: { select: { id: true, imageUrl: true, createdAt: true } },
    },
  });

  if (!visit) notFound();

  const cleaning = renderRecord(visit.cleaningChecks);
  const electrical = renderRecord(visit.electricalChecks);
  const chemicals = renderRecord(visit.chemicalAdditions);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">Αναλυτικη Επισκεψη</h1>
        <Link
          href="/app/admin/visits"
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 hover:bg-zinc-100"
        >
          Πισω στις αναφορες
        </Link>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <p className="font-semibold text-zinc-900">
          {visit.pool.code} - {visit.pool.clientName}
        </p>
        <p className="text-sm text-zinc-600">{new Date(visit.performedAt).toLocaleString("el-GR")}</p>
        <p className="mt-1 text-sm text-zinc-700">
          Τεχνικος: {visit.technician?.fullName ?? "Δεν δηλωθηκε"} ({visit.technician?.email ?? "-"})
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-zinc-900">Ελεγχοι</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Field label="pH" value={visit.ph?.toString()} />
          <Field label="Ολικο χλωριο" value={visit.totalChlorinePpm?.toString()} />
          <Field label="Ελευθερο χλωριο" value={visit.chlorinePpm?.toString()} />
          <Field label="Σκληροτητα" value={visit.hardnessPpm?.toString()} />
          <Field label="Αλκαλικοτητα" value={visit.alkalinityPpm?.toString()} />
          <Field label="Συγκεντρωση οξυγονου" value={visit.oxygenConcentrationPpm?.toString()} />
          <Field label="Ισοκυανουρικο οξυ" value={visit.cyanuricAcidPpm?.toString()} />
          <Field label="Σιδηρος" value={visit.ironPpm?.toString()} />
          <Field label="Τεστ μικροβιων" value={visit.microbeTest ?? undefined} />
          <Field label="Διαυγεια νερου" value={visit.waterClarityOk != null ? renderBoolean(visit.waterClarityOk) : undefined} />
          <Field label="Πιεση φιλτρου 1/2" value={visit.pressureBar?.toString()} />
          <Field label="Πιεση φιλτρου 3/4" value={visit.pressureBarSecondary?.toString()} />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-zinc-900">Καθαρισμοι / Ελεγχοι</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {cleaning.length === 0 ? (
            <p className="text-zinc-600">Δεν υπαρχουν δεδομενα.</p>
          ) : (
            cleaning.map(([key, val]) => <Field key={key} label={key} value={renderBoolean(val)} />)
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-zinc-900">Ηλεκτρικες εγκαταστασεις</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {electrical.length === 0 ? (
            <p className="text-zinc-600">Δεν υπαρχουν δεδομενα.</p>
          ) : (
            electrical.map(([key, val]) => <Field key={key} label={key} value={renderBoolean(val)} />)
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-zinc-900">Προσθηκες χημικων</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {chemicals.length === 0 ? (
            <p className="text-zinc-600">Δεν υπαρχουν δεδομενα.</p>
          ) : (
            chemicals.map(([key, val]) => <Field key={key} label={key} value={String(val ?? "")} />)
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-zinc-900">Παρατηρησεις</h2>
        <p className="mt-2 text-zinc-700">{visit.notes || "Χωρις παρατηρησεις"}</p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-zinc-900">Φωτογραφιες</h2>
        {visit.photos.length === 0 ? (
          <p className="mt-2 text-zinc-600">Δεν εχουν ανεβει φωτογραφιες.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {visit.photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-zinc-200 p-3 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Προβολη φωτογραφιας ({new Date(photo.createdAt).toLocaleString("el-GR")})
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="text-sm text-zinc-900">{value && value.trim() ? value : "-"}</p>
    </div>
  );
}
