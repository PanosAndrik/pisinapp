import { notFound } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { cardClass } from "@/components/ui/field-styles";
import { adminHref } from "@/lib/admin-nav";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CHEMICAL_LABELS,
  CLEANING_LABELS,
  ELECTRICAL_LABELS,
} from "@/lib/visit-labels";

export const dynamic = "force-dynamic";

type VisitDetailPageProps = {
  params: Promise<{ visitId: string }>;
};

function truthyChecks(value: unknown, labels: Record<string, string>) {
  if (!value || typeof value !== "object") return [] as Array<[string, string]>;
  return Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v === true)
    .map(([key]) => [labels[key] ?? key, "Ναι"] as [string, string]);
}

function nonEmptyText(value: unknown, labels: Record<string, string>) {
  if (!value || typeof value !== "object") return [] as Array<[string, string]>;
  return Object.entries(value as Record<string, unknown>)
    .map(([key, val]) => [labels[key] ?? key, String(val ?? "").trim()] as [string, string])
    .filter(([, val]) => val.length > 0);
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

  const checks = [
    ["pH", visit.ph?.toString() ?? ""],
    ["Ολικο χλωριο", visit.totalChlorinePpm?.toString() ?? ""],
    ["Ελευθερο χλωριο", visit.chlorinePpm?.toString() ?? ""],
    ["Σκληροτητα", visit.hardnessPpm?.toString() ?? ""],
    ["Αλκαλικοτητα", visit.alkalinityPpm?.toString() ?? ""],
    ["Συγκεντρωση οξυγονου", visit.oxygenConcentrationPpm?.toString() ?? ""],
    ["Ισοκυανουρικο οξυ", visit.cyanuricAcidPpm?.toString() ?? ""],
    ["Σιδηρος", visit.ironPpm?.toString() ?? ""],
    ["Τεστ μικροβιων", visit.microbeTest ?? ""],
    ["Πιεση φιλτρου 1/2", visit.pressureBar?.toString() ?? ""],
    ["Πιεση φιλτρου 3/4", visit.pressureBarSecondary?.toString() ?? ""],
  ] as Array<[string, string]>;
  const filteredChecks = checks.filter(([, val]) => val.trim().length > 0);
  if (visit.waterClarityOk === true) filteredChecks.push(["Διαυγεια νερου", "Ναι"]);

  const cleaning = truthyChecks(visit.cleaningChecks, CLEANING_LABELS);
  const electrical = truthyChecks(visit.electricalChecks, ELECTRICAL_LABELS);
  const chemicals = nonEmptyText(visit.chemicalAdditions, CHEMICAL_LABELS);

  const isSuperAdmin = session.role === "SUPER_ADMIN";
  const companyId = session.role === "SUPER_ADMIN" ? visit.companyId : session.companyId;

  return (
    <PageShell>
      <PageHeader
        title="Αναλυτικη Επισκεψη"
        backHref={adminHref("/app/admin/visits", { companyId, isSuperAdmin })}
        backLabel="Πισω στις επισκεψεις"
      />

      <section className={cardClass}>
        <p className="font-semibold text-zinc-900">
          {visit.pool.code} - {visit.pool.clientName}
        </p>
        <p className="text-sm text-zinc-600">{new Date(visit.performedAt).toLocaleString("el-GR")}</p>
        <p className="mt-1 text-sm text-zinc-700">
          Τεχνικος: {visit.technician?.fullName ?? "Δεν δηλωθηκε"} ({visit.technician?.email ?? "-"})
        </p>
      </section>

      {filteredChecks.length > 0 ? (
        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-zinc-900">Ελεγχοι</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {filteredChecks.map(([label, value]) => (
              <Field key={label} label={label} value={value} />
            ))}
          </div>
        </section>
      ) : null}

      {cleaning.length > 0 ? (
        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-zinc-900">Καθαρισμοι / Ελεγχοι</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {cleaning.map(([label, value]) => (
              <Field key={label} label={label} value={value} />
            ))}
          </div>
        </section>
      ) : null}

      {electrical.length > 0 ? (
        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-zinc-900">Ηλεκτρικες εγκαταστασεις</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {electrical.map(([label, value]) => (
              <Field key={label} label={label} value={value} />
            ))}
          </div>
        </section>
      ) : null}

      {chemicals.length > 0 ? (
        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-zinc-900">Προσθηκες χημικων</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {chemicals.map(([label, value]) => (
              <Field key={label} label={label} value={value} />
            ))}
          </div>
        </section>
      ) : null}

      {visit.notes && visit.notes.trim().length > 0 ? (
        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-zinc-900">Παρατηρησεις</h2>
          <p className="mt-2 text-zinc-700">{visit.notes}</p>
        </section>
      ) : null}

      {visit.photos.length > 0 ? (
        <section className={cardClass}>
          <h2 className="text-xl font-semibold text-zinc-900">Φωτογραφιες</h2>
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
        </section>
      ) : null}
    </PageShell>
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
