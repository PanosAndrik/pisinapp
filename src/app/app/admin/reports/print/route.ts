import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CHEMICAL_LABELS } from "@/lib/visit-labels";
import { aggregateChemicalUsage, loadVisitsInRange } from "@/lib/reports/data";
import { parseReportDateRange } from "@/lib/reports/date-range";
import { getVisitAlerts } from "@/lib/reports/visit-metrics";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const poolId = url.searchParams.get("poolId");
  if (!poolId) {
    return new NextResponse("Missing poolId", { status: 400 });
  }

  const companyId =
    session.role === "SUPER_ADMIN" && url.searchParams.get("companyId")
      ? url.searchParams.get("companyId")!
      : session.companyId;

  const pool = await prisma.pool.findFirst({
    where: { id: poolId, companyId },
    select: { code: true, clientName: true, address: true },
  });

  if (!pool) {
    return new NextResponse("Not found", { status: 404 });
  }

  const range = parseReportDateRange(
    url.searchParams.get("from") ?? undefined,
    url.searchParams.get("to") ?? undefined,
  );
  const visits = await loadVisitsInRange(companyId, range, { poolId });
  const chemicals = aggregateChemicalUsage(visits);

  const chemicalRows =
    chemicals.size === 0
      ? "<p>—</p>"
      : `<ul>${Array.from(chemicals.entries())
          .map(
            ([key, val]) =>
              `<li>${escapeHtml(CHEMICAL_LABELS[key] ?? key)}: ${escapeHtml(String(val))}</li>`,
          )
          .join("")}</ul>`;

  const visitRows = visits
    .map((v) => {
      const alerts =
        getVisitAlerts(v)
          .map((a) => a.message)
          .join("; ") || "OK";
      return `<tr>
        <td>${escapeHtml(new Date(v.performedAt).toLocaleString("el-GR"))}</td>
        <td>${escapeHtml(v.technician?.fullName ?? "—")}</td>
        <td>${escapeHtml(v.ph?.toString() ?? "—")}</td>
        <td>${escapeHtml(v.chlorinePpm?.toString() ?? "—")}</td>
        <td>${escapeHtml(v.pressureBar?.toString() ?? "—")}</td>
        <td>${escapeHtml(alerts)}</td>
        <td>${escapeHtml(v.notes ?? "")}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="utf-8" />
  <title>Report ${escapeHtml(pool.code)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; margin: 24px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .muted { color: #555; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f4f4f5; }
    .section { margin-top: 20px; }
    .no-print { margin-bottom: 16px; }
    @media print { .no-print { display: none; } body { margin: 12px; } }
  </style>
</head>
<body>
  <button type="button" class="no-print" onclick="window.print()">Εκτυπωση / Αποθήκευση ως PDF</button>
  <h1>Αναφορά συντήρησης πισίνας</h1>
  <p class="muted">${escapeHtml(pool.code)} — ${escapeHtml(pool.clientName)}${pool.address ? ` · ${escapeHtml(pool.address)}` : ""}</p>
  <p class="muted">Περίοδος: ${range.fromStr} — ${range.toStr} · ${visits.length} επισκέψεις</p>
  <div class="section">
    <h2 style="font-size:16px">Χημικά (σύνολα)</h2>
    ${chemicalRows}
  </div>
  <div class="section">
    <h2 style="font-size:16px">Επισκέψεις</h2>
    <table>
      <thead>
        <tr>
          <th>Ημερομηνία</th>
          <th>Τεχνικός</th>
          <th>pH</th>
          <th>Cl ppm</th>
          <th>Πίεση</th>
          <th>Alerts</th>
          <th>Σημειώσεις</th>
        </tr>
      </thead>
      <tbody>
        ${visitRows || '<tr><td colspan="7">Δεν υπάρχουν επισκέψεις</td></tr>'}
      </tbody>
    </table>
  </div>
  <p class="muted" style="margin-top:24px">Pisinapp — ${escapeHtml(new Date().toLocaleString("el-GR"))}</p>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
