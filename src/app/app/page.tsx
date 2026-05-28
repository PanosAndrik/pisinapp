import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppIndexPage() {
  const session = await requireSession();

  if (session.role === "ADMIN" || session.role === "SUPER_ADMIN") {
    redirect("/app/admin");
  }

  redirect("/app/technician");
}
