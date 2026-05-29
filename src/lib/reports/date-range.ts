export type ReportDateRange = {
  from: Date;
  to: Date;
  fromStr: string;
  toStr: string;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function formatDateInput(d: Date) {
  const shifted = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 10);
}

export function parseReportDateRange(
  fromParam?: string,
  toParam?: string,
  preset?: string,
): ReportDateRange {
  const now = new Date();
  let from: Date;
  let to: Date = endOfDay(now);

  if (preset === "today") {
    from = startOfDay(now);
  } else if (preset === "week") {
    from = startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));
  } else if (fromParam && toParam) {
    from = startOfDay(new Date(`${fromParam}T00:00:00`));
    to = endOfDay(new Date(`${toParam}T00:00:00`));
  } else {
    from = startOfDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
  }

  if (from > to) {
    const tmp = from;
    from = startOfDay(to);
    to = endOfDay(tmp);
  }

  return {
    from,
    to,
    fromStr: formatDateInput(from),
    toStr: formatDateInput(to),
  };
}

export function companyQuerySuffix(companyId: string, role: string) {
  return role === "SUPER_ADMIN" ? `companyId=${companyId}` : "";
}

export function withCompanyQuery(path: string, companyId: string, role: string, extra?: Record<string, string>) {
  const params = new URLSearchParams();
  if (role === "SUPER_ADMIN") params.set("companyId", companyId);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v) params.set(k, v);
    }
  }
  const q = params.toString();
  return q ? `${path}?${q}` : path;
}
