import { redirect } from "next/navigation";

import { AppHeader } from "@/components/app/app-header";
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

  const signOutButton = (
    <form action={handleSignOut}>
      <button
        type="submit"
        className="min-h-11 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 active:bg-zinc-100"
      >
        Αποσυνδεση
      </button>
    </form>
  );

  return (
    <div className="flex min-h-full flex-col bg-zinc-50">
      <AppHeader role={session.role} signOutSlot={signOutButton} />
      {children}
    </div>
  );
}
