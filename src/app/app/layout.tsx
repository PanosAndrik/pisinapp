import Link from "next/link";
import { redirect } from "next/navigation";

import { requireSession, signOut } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();

  async function handleSignOut() {
    "use server";
    await signOut();
    redirect("/");
  }

  return (
    <div className="min-h-full bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-semibold text-zinc-900">Pisinapp</p>
            <p className="text-xs uppercase tracking-wide text-zinc-500">{session.role}</p>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/app" className="text-sm text-zinc-700 hover:text-zinc-900">
              Αρχικη
            </Link>
            {session.role === "SUPER_ADMIN" ? (
              <Link href="/app/super-admin" className="text-sm text-zinc-700 hover:text-zinc-900">
                Υπερ Διαχειριση
              </Link>
            ) : null}
            {session.role === "ADMIN" || session.role === "SUPER_ADMIN" ? (
              <>
                <Link href="/app/admin" className="text-sm text-zinc-700 hover:text-zinc-900">
                  Διαχειριση
                </Link>
                <Link href="/app/admin/reports" className="text-sm text-zinc-700 hover:text-zinc-900">
                  Reports
                </Link>
              </>
            ) : null}
            <Link href="/app/technician" className="text-sm text-zinc-700 hover:text-zinc-900">
              Τεχνικος
            </Link>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 hover:bg-zinc-100"
              >
                Αποσυνδεση
              </button>
            </form>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
