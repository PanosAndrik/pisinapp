import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type VisitDetailPageProps = {
  params: Promise<{ visitId: string }>;
};

const CLEANING_LABELS: Record<string, string> = {
  cleanFilter1: "Καθαρισμος Φιλτρου 1",
  cleanFilter2: "Καθαρισμος Φιλτρου 2",
  cleanFilter34: "Καθαρισμος Φιλτρου 3/4",
  pump1: "Αντλια 1",
  pump2: "Αντλια 2",
  pump34: "Αντλια 3/4",
  chlorinator: "Χλωριωτης",
  vacuum: "Σκουπα",
  hydromassage: "Υδρομασαζ",
  waterfallPump: "Αντλια Καταρρακτη",
  autoDisinfection: "Αυτοματο συστημα απολυμανσης",
  overflowTank: "Δεξαμενη υπερχειλησης",
  heatExchanger: "Εναλλακτη",
  autoCleaning: "Αυτοματος καθαρισμος",
  saltElectrolysis: "Ηλεκτρολ. Αλατος",
  leaks: "Διαρροες",
  thermostat: "Θερμοστατης",
  dehumidifier: "Αφυγραντης",
  wellPump: "Αντλια Φρεατιου",
  ventilation: "Εξαερισμος",
  pipeSupports: "Στηριγματα Σωληνων",
  sandCheck: "Ελεγχος αμμου",
  multiValve: "Πολυβανα Φιλτρων",
};

const ELECTRICAL_LABELS: Record<string, string> = {
  underwaterLights: "Υποβρυχιοι προβολεις",
  transformer: "Μετασχηματιστης",
  electricalPanel: "Ηλεκτρικος πινακας",
};

const CHEMICAL_LABELS: Record<string, string> = {
  phMinusPlus: "pH minus / plus",
  chlorineBromine: "Χλωριο / Βρωμιο",
  oxygen: "Οξυγονο",
  algaecide: "Αλγοκτονο",
  flocculant: "Κροκιδωτικο",
  shockChlorination: "Χλωριωση Σοκ",
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

      {filteredChecks.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-900">Ελεγχοι</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {filteredChecks.map(([label, value]) => (
              <Field key={label} label={label} value={value} />
            ))}
          </div>
        </section>
      ) : null}

      {cleaning.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-900">Καθαρισμοι / Ελεγχοι</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {cleaning.map(([label, value]) => (
              <Field key={label} label={label} value={value} />
            ))}
          </div>
        </section>
      ) : null}

      {electrical.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-900">Ηλεκτρικες εγκαταστασεις</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {electrical.map(([label, value]) => (
              <Field key={label} label={label} value={value} />
            ))}
          </div>
        </section>
      ) : null}

      {chemicals.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-900">Προσθηκες χημικων</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {chemicals.map(([label, value]) => (
              <Field key={label} label={label} value={value} />
            ))}
          </div>
        </section>
      ) : null}

      {visit.notes && visit.notes.trim().length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-zinc-900">Παρατηρησεις</h2>
          <p className="mt-2 text-zinc-700">{visit.notes}</p>
        </section>
      ) : null}

      {visit.photos.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
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
