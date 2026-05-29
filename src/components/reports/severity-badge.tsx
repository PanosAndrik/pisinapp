import type { AlertSeverity } from "@/lib/reports/thresholds";

const STYLES: Record<AlertSeverity, string> = {
  info: "bg-blue-50 text-blue-800 border-blue-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
  critical: "bg-red-50 text-red-900 border-red-200",
};

const LABELS: Record<AlertSeverity, string> = {
  info: "Πληροφορια",
  warning: "Προσοχη",
  critical: "Κρισιμο",
};

export function SeverityBadge({ severity }: { severity: AlertSeverity }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STYLES[severity]}`}
    >
      {LABELS[severity]}
    </span>
  );
}
