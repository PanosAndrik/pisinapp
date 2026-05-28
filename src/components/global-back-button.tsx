"use client";

import { useRouter } from "next/navigation";

export function GlobalBackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="fixed left-4 top-4 z-50 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-100"
    >
      Back
    </button>
  );
}
