import { prisma } from "@/lib/prisma";
import type { ReportDateRange } from "@/lib/reports/date-range";
import {
  daysSince,
  getNoVisitAlert,
  getVisitAlerts,
  getVisitCompletenessPercent,
  type VisitMetricsInput,
} from "@/lib/reports/visit-metrics";
import type { AlertSeverity, VisitAlert } from "@/lib/reports/thresholds";

const visitSelect = {
  id: true,
  poolId: true,
  technicianId: true,
  performedAt: true,
  ph: true,
  chlorinePpm: true,
  totalChlorinePpm: true,
  hardnessPpm: true,
  alkalinityPpm: true,
  oxygenConcentrationPpm: true,
  cyanuricAcidPpm: true,
  ironPpm: true,
  microbeTest: true,
  waterClarityOk: true,
  pressureBar: true,
  pressureBarSecondary: true,
  cleaningChecks: true,
  electricalChecks: true,
  chemicalAdditions: true,
  notes: true,
  pool: { select: { id: true, code: true, clientName: true } },
  technician: { select: { id: true, fullName: true } },
} as const;

export type ReportVisit = Awaited<ReturnType<typeof loadVisitsInRange>>[number];

export async function loadVisitsInRange(
  companyId: string,
  range: ReportDateRange,
  filters?: { poolId?: string; technicianId?: string },
) {
  return prisma.visit.findMany({
    where: {
      companyId,
      performedAt: { gte: range.from, lte: range.to },
      ...(filters?.poolId ? { poolId: filters.poolId } : {}),
      ...(filters?.technicianId ? { technicianId: filters.technicianId } : {}),
    },
    orderBy: { performedAt: "desc" },
    select: visitSelect,
  });
}

export async function loadReportContext(companyId: string) {
  const [pools, technicians] = await Promise.all([
    prisma.pool.findMany({
      where: { companyId, isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, clientName: true },
    }),
    prisma.user.findMany({
      where: { companyId, isActive: true, role: "TECHNICIAN" },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, email: true },
    }),
  ]);
  return { pools, technicians };
}

export type PoolAlertRow = {
  poolId: string;
  poolCode: string;
  clientName: string;
  lastVisitAt: Date | null;
  daysWithoutVisit: number | null;
  alerts: VisitAlert[];
  latestVisitId: string | null;
};

export async function loadPoolAlertRows(companyId: string, now = new Date()): Promise<PoolAlertRow[]> {
  const pools = await prisma.pool.findMany({
    where: { companyId, isActive: true },
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      clientName: true,
      visits: {
        orderBy: { performedAt: "desc" },
        take: 1,
        select: visitSelect,
      },
    },
  });

  return pools.map((pool) => {
    const latest = pool.visits[0] ?? null;
    const alerts: VisitAlert[] = [];

    if (!latest) {
      alerts.push({
        type: "NO_VISIT",
        severity: "critical",
        message: "Ποτε δεν καταχωρηθηκε επίσκεψη",
      });
      return {
        poolId: pool.id,
        poolCode: pool.code,
        clientName: pool.clientName,
        lastVisitAt: null,
        daysWithoutVisit: null,
        alerts,
        latestVisitId: null,
      };
    }

    const days = daysSince(latest.performedAt, now);
    const noVisit = getNoVisitAlert(days);
    if (noVisit) alerts.push(noVisit);
    alerts.push(...getVisitAlerts(latest as VisitMetricsInput));

    return {
      poolId: pool.id,
      poolCode: pool.code,
      clientName: pool.clientName,
      lastVisitAt: latest.performedAt,
      daysWithoutVisit: days,
      alerts,
      latestVisitId: latest.id,
    };
  });
}

export type TechnicianStatsRow = {
  technicianId: string;
  fullName: string;
  visitCount: number;
  alertVisitCount: number;
  avgCompleteness: number;
  poolCount: number;
};

export function buildTechnicianStats(visits: ReportVisit[]): TechnicianStatsRow[] {
  const map = new Map<
    string,
    { fullName: string; visits: ReportVisit[]; pools: Set<string> }
  >();

  for (const visit of visits) {
    const id = visit.technicianId ?? "unknown";
    const name = visit.technician?.fullName ?? "Χωρις τεχνικο";
    const entry = map.get(id) ?? { fullName: name, visits: [], pools: new Set() };
    entry.visits.push(visit);
    entry.pools.add(visit.poolId);
    map.set(id, entry);
  }

  return Array.from(map.entries())
    .filter(([id]) => id !== "unknown")
    .map(([technicianId, data]) => {
      const alertVisitCount = data.visits.filter((v) => getVisitAlerts(v).length > 0).length;
      const avgCompleteness =
        data.visits.length === 0
          ? 0
          : Math.round(
              data.visits.reduce((sum, v) => sum + getVisitCompletenessPercent(v), 0) /
                data.visits.length,
            );
      return {
        technicianId,
        fullName: data.fullName,
        visitCount: data.visits.length,
        alertVisitCount,
        avgCompleteness,
        poolCount: data.pools.size,
      };
    })
    .sort((a, b) => b.visitCount - a.visitCount);
}

export type TrendPoint = { date: string; value: number };

export function buildTrend(
  visits: ReportVisit[],
  field: "ph" | "chlorinePpm" | "pressureBar",
): TrendPoint[] {
  return [...visits]
    .sort((a, b) => a.performedAt.getTime() - b.performedAt.getTime())
    .map((v) => {
      const raw = v[field];
      const value = raw != null ? Number(raw) : NaN;
      return {
        date: v.performedAt.toLocaleDateString("el-GR"),
        value,
      };
    })
    .filter((p) => Number.isFinite(p.value));
}

export function countAlertsBySeverity(rows: PoolAlertRow[]) {
  const counts: Record<AlertSeverity, number> = { info: 0, warning: 0, critical: 0 };
  for (const row of rows) {
    for (const alert of row.alerts) {
      counts[alert.severity] += 1;
    }
  }
  return counts;
}

export function aggregateChemicalUsage(visits: ReportVisit[]) {
  const totals = new Map<string, number>();
  for (const visit of visits) {
    if (!visit.chemicalAdditions || typeof visit.chemicalAdditions !== "object") continue;
    for (const [key, val] of Object.entries(visit.chemicalAdditions as Record<string, unknown>)) {
      const text = String(val ?? "").trim();
      if (!text) continue;
      const num = Number(text.replace(",", "."));
      if (Number.isFinite(num)) {
        totals.set(key, (totals.get(key) ?? 0) + num);
      } else {
        totals.set(key, (totals.get(key) ?? 0) + 1);
      }
    }
  }
  return totals;
}
