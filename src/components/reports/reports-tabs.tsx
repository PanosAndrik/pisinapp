import Link from "next/link";

import { withCompanyQuery } from "@/lib/reports/date-range";

const TABS = [
  { id: "overview", label: "Επισκοπηση" },
  { id: "alerts", label: "Alerts" },
  { id: "pools", label: "Ανα πισινα" },
  { id: "technicians", label: "Ανα τεχνικο" },
  { id: "visits", label: "Επισκεψεις" },
] as const;

type ReportsTabsProps = {
  companyId: string;
  role: string;
  activeTab: string;
  fromStr: string;
  toStr: string;
  poolId?: string;
  technicianId?: string;
};

export function ReportsTabs({
  companyId,
  role,
  activeTab,
  fromStr,
  toStr,
  poolId,
  technicianId,
}: ReportsTabsProps) {
  return (
    <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((tab) => {
        const href = withCompanyQuery("/app/admin/reports", companyId, role, {
          tab: tab.id,
          from: fromStr,
          to: toStr,
          ...(poolId ? { poolId } : {}),
          ...(technicianId ? { technicianId } : {}),
        });
        const active = activeTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={href}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
              active
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300 text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
