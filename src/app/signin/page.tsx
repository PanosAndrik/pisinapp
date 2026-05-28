import Link from "next/link";
import { redirect } from "next/navigation";

import { ensureBootstrapAdmin } from "@/lib/app-context";
import { getSession, signIn } from "@/lib/auth";

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
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Access your company dashboard with the credentials created by the admin team.
        </p>
        {params.error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Invalid credentials. Please try again.
          </p>
        ) : null}
        <form action={handleSignIn} className="mt-4 space-y-3">
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Password"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Sign in
          </button>
        </form>
      </div>
      <Link href="/" className="mt-4 text-center text-sm text-zinc-600 hover:text-zinc-900">
        Back to website
      </Link>
    </main>
  );
}
