import Link from "next/link";

import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-10 flex flex-col gap-4 sm:mb-16 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Pisinapp</h1>
          <p className="text-sm text-zinc-600">Πλατφορμα Διαχειρισης Συντηρησης Πισινας</p>
        </div>
        <Link
          href={session ? "/app" : "/signin"}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
        >
          {session ? "Ανοιγμα Εφαρμογης" : "Συνδεση"}
        </Link>
      </header>

      <section className="grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold leading-tight text-zinc-900 sm:text-4xl">
            Ψηφιακη συντηρηση πισινας για συγχρονες ομαδες service.
          </h2>
          <p className="text-lg text-zinc-600">
            Αντικαταστησε τα χειρογραφα δελτια με live αναφορες επισκεψης, φωτογραφιες, παρακολουθηση
            χημικων και υπενθυμισεις.
          </p>
          <div className="flex gap-3 pt-2">
            <Link
              href={session ? "/app" : "/signin"}
              className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-700"
            >
              {session ? "Μεταβαση στον πινακα" : "Συνδεση στην πλατφορμα"}
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900">Τι προσφερει</h3>
          <ul className="mt-4 space-y-2 text-zinc-700">
            <li>- Καταλογος πισινων ανα εταιρεια και πελατη.</li>
            <li>- Φορμες επισκεψης τεχνικου με μετρησεις.</li>
            <li>- Φωτογραφιες και ιστορικο αναφορων.</li>
            <li>- Δικαιωματα προσβασης ανα ρολο χρηστη.</li>
            <li>- Υποστηριξη πολλων εταιρειων σε ενα συστημα.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
