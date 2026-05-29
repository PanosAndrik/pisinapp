export function PageShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 py-4 pb-10 sm:gap-6 sm:px-6 sm:py-6 ${className}`.trim()}
    >
      {children}
    </main>
  );
}