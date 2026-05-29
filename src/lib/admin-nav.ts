/** Build admin URLs with optional companyId for super admin. */
export function adminHref(
  path: string,
  options?: { companyId?: string; isSuperAdmin?: boolean; query?: Record<string, string> },
) {
  const params = new URLSearchParams();
  if (options?.isSuperAdmin && options.companyId) {
    params.set("companyId", options.companyId);
  }
  if (options?.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v) params.set(k, v);
    }
  }
  const q = params.toString();
  return q ? `${path}?${q}` : path;
}
