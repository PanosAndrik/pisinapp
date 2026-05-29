import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { loadVisitsInRange } from "@/lib/reports/data";
import { parseReportDateRange } from "@/lib/reports/date-range";
import { getVisitAlerts } from "@/lib/reports/visit-metrics";

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const companyId =
    session.role === "SUPER_ADMIN" && url.searchParams.get("companyId")
      ? url.searchParams.get("companyId")!
      : session.companyId;

  const range = parseReportDateRange(
    url.searchParams.get("from") ?? undefined,
    url.searchParams.get("to") ?? undefined,
  );
  const poolId = url.searchParams.get("poolId") ?? undefined;
  const technicianId = url.searchParams.get("technicianId") ?? undefined;

  const visits = await loadVisitsInRange(companyId, range, { poolId, technicianId });

  const header = [
    "date",
    "pool_code",
    "client",
    "technician",
    "ph",
    "free_chlorine_ppm",
    "total_chlorine_ppm",
    "pressure_bar",
    "pressure_bar_secondary",
    "alkalinity_ppm",
    "notes",
    "alerts",
  ];

  const rows = visits.map((v) => {
    const alerts = getVisitAlerts(v)
      .map((a) => a.message)
      .join("; ");
    return [
      new Date(v.performedAt).toISOString(),
      v.pool.code,
      v.pool.clientName,
      v.technician?.fullName ?? "",
      v.ph?.toString() ?? "",
      v.chlorinePpm?.toString() ?? "",
      v.totalChlorinePpm?.toString() ?? "",
      v.pressureBar?.toString() ?? "",
      v.pressureBarSecondary?.toString() ?? "",
      v.alkalinityPpm?.toString() ?? "",
      v.notes ?? "",
      alerts,
    ]
      .map((cell) => csvEscape(String(cell)))
      .join(",");
  });

  const csv = [header.join(","), ...rows].join("\n");
  const filename = `pisinapp-visits-${range.fromStr}_${range.toStr}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
