import type { Prisma } from "@prisma/client";

import { WATER_THRESHOLDS, type VisitAlert } from "@/lib/reports/thresholds";

export type VisitMetricsInput = {
  performedAt: Date;
  ph: Prisma.Decimal | null;
  chlorinePpm: Prisma.Decimal | null;
  totalChlorinePpm: Prisma.Decimal | null;
  pressureBar: Prisma.Decimal | null;
  pressureBarSecondary: Prisma.Decimal | null;
  waterClarityOk: boolean | null;
  hardnessPpm?: Prisma.Decimal | null;
  alkalinityPpm?: Prisma.Decimal | null;
  oxygenConcentrationPpm?: Prisma.Decimal | null;
  cyanuricAcidPpm?: Prisma.Decimal | null;
  ironPpm?: Prisma.Decimal | null;
  microbeTest?: string | null;
  cleaningChecks?: unknown;
  electricalChecks?: unknown;
  chemicalAdditions?: unknown;
  notes?: string | null;
};

export function toNumber(value: Prisma.Decimal | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function getVisitAlerts(visit: VisitMetricsInput): VisitAlert[] {
  const alerts: VisitAlert[] = [];

  const ph = toNumber(visit.ph);
  if (ph != null && (ph < WATER_THRESHOLDS.phMin || ph > WATER_THRESHOLDS.phMax)) {
    alerts.push({
      type: "PH_OUT_OF_RANGE",
      severity: "warning",
      message: `pH ${ph} (συνιστωμενο ${WATER_THRESHOLDS.phMin}–${WATER_THRESHOLDS.phMax})`,
    });
  }

  const freeCl = toNumber(visit.chlorinePpm);
  if (freeCl != null && freeCl < WATER_THRESHOLDS.freeChlorineMin) {
    alerts.push({
      type: "CHLORINE_LOW",
      severity: "warning",
      message: `Ελευθερο χλωριο ${freeCl} ppm (< ${WATER_THRESHOLDS.freeChlorineMin})`,
    });
  }

  const pressure = toNumber(visit.pressureBar);
  if (pressure != null && pressure > WATER_THRESHOLDS.pressureMax) {
    alerts.push({
      type: "PRESSURE_HIGH",
      severity: "warning",
      message: `Πιεση φιλτρου 1/2 ${pressure} bar (> ${WATER_THRESHOLDS.pressureMax})`,
    });
  }

  const pressure2 = toNumber(visit.pressureBarSecondary);
  if (pressure2 != null && pressure2 > WATER_THRESHOLDS.pressureMax) {
    alerts.push({
      type: "PRESSURE_SECONDARY_HIGH",
      severity: "warning",
      message: `Πιεση φιλτρου 3/4 ${pressure2} bar (> ${WATER_THRESHOLDS.pressureMax})`,
    });
  }

  if (visit.waterClarityOk === false) {
    alerts.push({
      type: "WATER_CLARITY",
      severity: "warning",
      message: "Διαυγεια νερου: οχι",
    });
  }

  return alerts;
}

const CORE_FIELDS: Array<keyof VisitMetricsInput> = [
  "ph",
  "chlorinePpm",
  "totalChlorinePpm",
  "hardnessPpm",
  "alkalinityPpm",
  "pressureBar",
  "pressureBarSecondary",
];

export function getVisitCompletenessPercent(visit: VisitMetricsInput): number {
  let filled = 0;
  for (const key of CORE_FIELDS) {
    const val = visit[key];
    if (val != null && String(val).trim() !== "") filled += 1;
  }
  if (visit.notes && visit.notes.trim().length > 0) filled += 1;
  const total = CORE_FIELDS.length + 1;
  return Math.round((filled / total) * 100);
}

export function daysSince(date: Date, from: Date = new Date()) {
  const ms = from.getTime() - date.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function getNoVisitAlert(days: number): VisitAlert | null {
  if (days >= WATER_THRESHOLDS.daysWithoutVisitCritical) {
    return {
      type: "NO_VISIT",
      severity: "critical",
      message: `Χωρις επίσκεψη ${days} ημερες`,
    };
  }
  if (days >= WATER_THRESHOLDS.daysWithoutVisitWarning) {
    return {
      type: "NO_VISIT",
      severity: "warning",
      message: `Χωρις επίσκεψη ${days} ημερες`,
    };
  }
  return null;
}
