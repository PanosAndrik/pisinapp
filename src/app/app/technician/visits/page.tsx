import { revalidatePath } from "next/cache";

import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { btnPrimaryClass, cardClass, fieldClass } from "@/components/ui/field-styles";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CLEANING_ITEMS = [
  ["cleanFilter1", "Καθαρισμος Φιλτρου 1"],
  ["cleanFilter2", "Καθαρισμος Φιλτρου 2"],
  ["cleanFilter34", "Καθαρισμος Φιλτρου 3/4"],
  ["pump1", "Αντλια 1"],
  ["pump2", "Αντλια 2"],
  ["pump34", "Αντλια 3/4"],
  ["chlorinator", "Χλωριωτης"],
  ["vacuum", "Σκουπα"],
  ["hydromassage", "Υδρομασαζ"],
  ["waterfallPump", "Αντλια Καταρρακτη"],
  ["autoDisinfection", "Αυτοματο συστημα απολυμανσης"],
  ["overflowTank", "Δεξαμενη υπερχειλησης"],
  ["heatExchanger", "Εναλλακτη"],
  ["autoCleaning", "Αυτοματος καθαρισμος"],
  ["saltElectrolysis", "Ηλεκτρολ. Αλατος"],
  ["leaks", "Διαρροες"],
  ["thermostat", "Θερμοστατης"],
  ["dehumidifier", "Αφυγραντης"],
  ["wellPump", "Αντλια Φρεατιου"],
  ["ventilation", "Εξαερισμος"],
  ["pipeSupports", "Στηριγματα Σωληνων"],
  ["sandCheck", "Ελεγχος αμμου"],
  ["multiValve", "Πολυβανα Φιλτρων"],
] as const;

const ELECTRICAL_ITEMS = [
  ["underwaterLights", "Υποβρυχιοι προβολεις"],
  ["transformer", "Μετασχηματιστης"],
  ["electricalPanel", "Ηλεκτρικος πινακας"],
] as const;

const CHEMICAL_ITEMS = [
  ["phMinusPlus", "pH minus / plus"],
  ["chlorineBromine", "Χλωριο / Βρωμιο"],
  ["oxygen", "Οξυγονο"],
  ["algaecide", "Αλγοκτονο"],
  ["flocculant", "Κροκιδωτικο"],
  ["shockChlorination", "Χλωριωση Σοκ"],
] as const;

function parseOptionalDecimal(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim().replace(",", ".");
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDateInputValue(now: Date) {
  const shifted = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 10);
}

function toTimeInputValue(now: Date) {
  const shifted = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(11, 16);
}

function toRecordBoolean(formData: FormData, items: ReadonlyArray<readonly [string, string]>) {
  return Object.fromEntries(items.map(([key]) => [key, formData.get(key) === "on"]));
}

function toRecordText(formData: FormData, items: ReadonlyArray<readonly [string, string]>) {
  return Object.fromEntries(items.map(([key]) => [key, String(formData.get(key) ?? "").trim()]));
}

async function createVisit(formData: FormData) {
  "use server";

  const session = await requireSession();
  const targetCompanyIdRaw = String(formData.get("companyId") ?? "").trim();
  const companyId =
    session.role === "SUPER_ADMIN" && targetCompanyIdRaw ? targetCompanyIdRaw : session.companyId;
  const poolId = String(formData.get("poolId") ?? "").trim();
  const visitDate = String(formData.get("visitDate") ?? "").trim();
  const visitTime = String(formData.get("visitTime") ?? "").trim() || "09:00";
  const notes = String(formData.get("notes") ?? "").trim();

  if (!poolId || !visitDate) return;

  const createdVisit = await prisma.visit.create({
    data: {
      companyId,
      poolId,
      technicianId: session.userId,
      performedAt: new Date(`${visitDate}T${visitTime}:00`),
      ph: parseOptionalDecimal(formData.get("ph")),
      totalChlorinePpm: parseOptionalDecimal(formData.get("totalChlorinePpm")),
      chlorinePpm: parseOptionalDecimal(formData.get("chlorinePpm")),
      hardnessPpm: parseOptionalDecimal(formData.get("hardnessPpm")),
      alkalinityPpm: parseOptionalDecimal(formData.get("alkalinityPpm")),
      oxygenConcentrationPpm: parseOptionalDecimal(formData.get("oxygenConcentrationPpm")),
      cyanuricAcidPpm: parseOptionalDecimal(formData.get("cyanuricAcidPpm")),
      ironPpm: parseOptionalDecimal(formData.get("ironPpm")),
      microbeTest: String(formData.get("microbeTest") ?? "").trim() || null,
      waterClarityOk: formData.get("waterClarityOk") === "on",
      pressureBar: parseOptionalDecimal(formData.get("pressureBar")),
      pressureBarSecondary: parseOptionalDecimal(formData.get("pressureBarSecondary")),
      cleaningChecks: toRecordBoolean(formData, CLEANING_ITEMS),
      electricalChecks: toRecordBoolean(formData, ELECTRICAL_ITEMS),
      chemicalAdditions: toRecordText(formData, CHEMICAL_ITEMS),
      notes: notes || null,
    },
  });

  const uploadedFiles = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const photoUrls: string[] = [];
  for (const file of uploadedFiles) {
    const bytes = Buffer.from(await file.arrayBuffer());
    // Store inline data URL for now; we can move this to object storage later.
    photoUrls.push(`data:${file.type || "image/jpeg"};base64,${bytes.toString("base64")}`);
  }

  if (photoUrls.length > 0) {
    await prisma.visitPhoto.createMany({
      data: photoUrls.map((url) => ({ visitId: createdVisit.id, imageUrl: url })),
    });
  }

  revalidatePath("/app/technician/visits");
  revalidatePath("/app/technician");
}

type TechnicianVisitsPageProps = {
  searchParams: Promise<{ companyId?: string }>;
};

export default async function TechnicianVisitsPage({ searchParams }: TechnicianVisitsPageProps) {
  const session = await requireSession();
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
      where:
        session.role === "TECHNICIAN"
          ? { companyId, technicianId: session.userId }
          : { companyId },
      orderBy: { performedAt: "desc" },
      take: 30,
      include: { pool: { select: { code: true, clientName: true } } },
    }),
  ]);

  const now = new Date();

  const backHref =
    session.role === "SUPER_ADMIN" && params.companyId
      ? `/app/technician?companyId=${params.companyId}`
      : "/app/technician";

  return (
    <PageShell className="max-w-5xl">
      <PageHeader
        title="Καταχωρηση Επισκεψης"
        backHref={backHref}
        backLabel="Πισω"
      />

      <section className={cardClass}>
        {pools.length === 0 ? (
          <p className="text-zinc-600">Δεν υπαρχουν διαθεσιμες πισινες ακομα.</p>
        ) : (
          <form action={createVisit} className="grid gap-4 sm:grid-cols-2">
            {session.role === "SUPER_ADMIN" ? <input type="hidden" name="companyId" value={companyId} /> : null}

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-zinc-700">Πισινα</label>
              <select name="poolId" className={fieldClass} required>
                <option value="">Επιλογη πισινας</option>
                {pools.map((pool) => (
                  <option key={pool.id} value={pool.id}>
                    {pool.code} - {pool.clientName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Ημερομηνια</label>
              <input
                name="visitDate"
                type="date"
                defaultValue={toDateInputValue(now)}
                className={fieldClass}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Ωρα</label>
              <input
                name="visitTime"
                type="time"
                defaultValue={toTimeInputValue(now)}
                className={fieldClass}
              />
            </div>

            <Section title="Ελεγχοι">
              <LabeledInput name="ph" label="Ph" helper="Συνιστωμενη τιμη: 7.2 - 7.8" />
              <LabeledInput name="totalChlorinePpm" label="Ολικο χλωριο" />
              <LabeledInput name="chlorinePpm" label="Ελευθερο χλωριο" helper="Συνιστωμενη τιμη: >0.4 ppm" />
              <LabeledInput name="hardnessPpm" label="Σκληροτητα" />
              <LabeledInput name="alkalinityPpm" label="Αλκαλικοτητα" />
              <LabeledInput name="oxygenConcentrationPpm" label="Συγκεντρωση οξυγονο" />
              <LabeledInput name="cyanuricAcidPpm" label="Ισοκυανουρικο οξυ" />
              <LabeledInput name="ironPpm" label="Σιδηρος" />
              <LabeledInput name="microbeTest" label="Τεστ μικροβιων" />
              <label className="flex min-h-[44px] items-center justify-between rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800">
                Διαυγεια νερου
                <input name="waterClarityOk" type="checkbox" className="h-5 w-5 shrink-0" />
              </label>
              <LabeledInput
                name="pressureBar"
                label="Πιεση φιλτρου 1/2"
                helper="Συνιστωμενη τιμη: <2,0 bars"
              />
              <LabeledInput
                name="pressureBarSecondary"
                label="Πιεση φιλτρου 3/4"
                helper="Συνιστωμενη τιμη: <2,0 bars"
              />
            </Section>

            <Section title="Καθαρισμοι / Ελεγχοι">
              {CLEANING_ITEMS.map(([key, label]) => (
                <label
                  key={key}
                  className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800"
                >
                  <span className="min-w-0 flex-1">{label}</span>
                  <input name={key} type="checkbox" className="h-5 w-5 shrink-0" />
                </label>
              ))}
            </Section>

            <Section title="Ηλεκτρικες εγκαταστασεις">
              {ELECTRICAL_ITEMS.map(([key, label]) => (
                <label
                  key={key}
                  className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800"
                >
                  <span className="min-w-0 flex-1">{label}</span>
                  <input name={key} type="checkbox" className="h-5 w-5 shrink-0" />
                </label>
              ))}
            </Section>

            <Section title="Προσθηκες χημικων">
              {CHEMICAL_ITEMS.map(([key, label]) => (
                <LabeledInput key={key} name={key} label={label} />
              ))}
            </Section>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-zinc-700">Παρατηρησεις</label>
              <textarea
                name="notes"
                rows={3}
                className={fieldClass}
                placeholder="Γραψε παρατηρησεις..."
              />
            </div>

            <div className="sm:col-span-2 rounded-xl border border-zinc-200 p-4">
              <h2 className="text-lg font-semibold text-zinc-900">Φωτογραφιες (προαιρετικο)</h2>
              <label className="mt-3 block text-sm font-medium text-zinc-700">
                Ανεβασμα φωτογραφιων
                <input
                  name="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  className={`mt-1 block ${fieldClass}`}
                />
              </label>
              <p className="mt-2 text-xs text-zinc-500">
                Μπορεις να ανεβασεις πολλες φωτογραφιες. Δεν ειναι υποχρεωτικες.
              </p>
            </div>

            <button type="submit" className={`${btnPrimaryClass} sm:col-span-2`}>
              Αποθηκευση επισκεψης
            </button>
          </form>
        )}
      </section>

      <section className={cardClass}>
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
                <p className="mt-1 text-sm text-zinc-700">{visit.notes ?? "Χωρις παρατηρησεις"}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={`sm:col-span-2 ${cardClass} !p-4`}>
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function LabeledInput({
  name,
  label,
  helper,
}: {
  name: string;
  label: string;
  helper?: string;
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-2 text-sm font-medium text-zinc-700">
        {label}
        {helper ? <HelpBubble text={helper} /> : null}
      </label>
      <input name={name} className={fieldClass} />
    </div>
  );
}

function HelpBubble({ text }: { text: string }) {
  return (
    <details className="relative inline-block">
      <summary className="cursor-pointer list-none rounded-full border border-zinc-300 px-1.5 text-xs">?</summary>
      <div className="absolute left-6 top-0 z-10 w-52 rounded-md border border-zinc-200 bg-white p-2 text-xs text-zinc-700 shadow-md">
        {text}
      </div>
    </details>
  );
}
