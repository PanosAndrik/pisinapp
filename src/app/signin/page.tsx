import Link from "next/link";
import { redirect } from "next/navigation";

import { btnPrimaryClass, cardClass, fieldClass } from "@/components/ui/field-styles";
import { ensureBootstrapAdmin } from "@/lib/app-context";
import { getSession, signIn } from "@/lib/auth";

export const dynamic = "force-dynamic";

type SignInPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  await ensureBootstrapAdmin();
  const session = await getSession();
  if (session) redirect("/app");

  const params = await searchParams;

  async function handleSignIn(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const ok = await signIn(email, password);
    if (!ok) redirect("/signin?error=1");
    redirect("/app");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:py-10">
      <div className={cardClass}>
        <h1 className="text-2xl font-semibold text-zinc-900">Συνδεση</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Συνδεσου με τα στοιχεια που σου εδωσε η διαχειριση.
        </p>
        {params.error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Λαθος στοιχεια. Δοκιμασε ξανα.
          </p>
        ) : null}
        <form action={handleSignIn} className="mt-4 space-y-3">
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className={fieldClass}
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Κωδικος"
            className={fieldClass}
          />
          <button type="submit" className={btnPrimaryClass}>
            Συνδεση
          </button>
        </form>
      </div>
      <Link href="/" className="mt-4 text-center text-sm text-zinc-600 hover:text-zinc-900">
        Πισω στην αρχικη
      </Link>
    </main>
  );
}
