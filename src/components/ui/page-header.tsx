import Link from "next/link";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
};

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Πισω",
  actions,
}: PageHeaderProps) {
  return (
    <header className="mb-5 space-y-3 sm:mb-6">
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-zinc-600 active:text-zinc-900"
        >
          <span aria-hidden className="text-lg leading-none">
            ←
          </span>
          {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl lg:text-3xl">
            {title}
          </h1>
          {subtitle ? <p className="mt-1 text-sm text-zinc-600">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto">{actions}</div> : null}
      </div>
    </header>
  );
}
