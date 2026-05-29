"use client";

import Link from "next/link";
import { useState } from "react";

type AppHeaderProps = {
  role: "SUPER_ADMIN" | "ADMIN" | "TECHNICIAN";
  signOutSlot: React.ReactNode;
};

export function AppHeader({ role, signOutSlot }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/app", label: "Αρχικη" },
    ...(role === "SUPER_ADMIN"
      ? [{ href: "/app/super-admin", label: "Υπερ Διαχειριση" }]
      : []),
    ...(role === "ADMIN" || role === "SUPER_ADMIN"
      ? [
          { href: "/app/admin", label: "Διαχειριση" },
          { href: "/app/admin/reports", label: "Reports" },
        ]
      : []),
    { href: "/app/technician", label: "Τεχνικος" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:px-6">
        <Link href="/app" className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-zinc-900 sm:text-lg">Pisinapp</p>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500 sm:text-xs">{role}</p>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-2.5 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
            >
              {link.label}
            </Link>
          ))}
          {signOutSlot}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {signOutSlot}
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-zinc-300 px-3 text-sm font-medium"
            aria-expanded={menuOpen}
            aria-label="Μενου"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav className="border-t border-zinc-200 px-3 py-2 md:hidden">
          <ul className="flex flex-col">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-zinc-800 active:bg-zinc-100"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
