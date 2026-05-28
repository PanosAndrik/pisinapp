import Link from "next/link";

import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-10">
      <header className="mb-16 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Pisinapp</h1>
          <p className="text-sm text-zinc-600">Pool Maintenance Platform</p>
        </div>
        <Link
          href={session ? "/app" : "/signin"}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
        >
          {session ? "Open App" : "Sign in"}
        </Link>
      </header>

      <section className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-4xl font-bold leading-tight text-zinc-900">
            Digital pool maintenance for modern service teams.
          </h2>
          <p className="text-lg text-zinc-600">
            Replace paper visit sheets with live service reports, photos, water chemistry tracking,
            and maintenance reminders.
          </p>
          <div className="flex gap-3 pt-2">
            <Link
              href={session ? "/app" : "/signin"}
              className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700"
            >
              {session ? "Go to dashboard" : "Sign in to platform"}
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900">What you get</h3>
          <ul className="mt-4 space-y-2 text-zinc-700">
            <li>- Pool registry by company and client.</li>
            <li>- Technician visit forms with measured values.</li>
            <li>- Photo evidence and report history.</li>
            <li>- Role-based access for admins and technicians.</li>
            <li>- Multi-company architecture from one codebase.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
