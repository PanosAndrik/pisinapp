import { revalidatePath } from "next/cache";

import { hashPassword, requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function addTechnician(formData: FormData) {
  "use server";

  const session = await requireAdminSession();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  if (!fullName || !email || !password) return;

  await prisma.user.create({
    data: {
      companyId: session.companyId,
      fullName,
      email,
      passwordHash: hashPassword(password),
      role: "TECHNICIAN",
      isActive: true,
    },
  });

  revalidatePath("/app/admin/team");
}

export default async function AdminTeamPage() {
  const session = await requireAdminSession();
  const members = await prisma.user.findMany({
    where: { companyId: session.companyId, isActive: true },
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
    select: { id: true, fullName: true, email: true, role: true },
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-3xl font-semibold text-zinc-900">Team Management</h1>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Add technician</h2>
        <form action={addTechnician} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            name="fullName"
            placeholder="Technician name"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
          <input
            name="email"
            type="email"
            placeholder="Technician email"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
          <input
            name="password"
            type="password"
            placeholder="Temporary password"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2 sm:col-span-2"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 sm:col-span-2"
          >
            Add technician
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Active users</h2>
        <div className="mt-4 space-y-2">
          {members.map((member) => (
            <div key={member.id} className="rounded-lg border border-zinc-200 px-3 py-2">
              <p className="text-sm font-medium text-zinc-900">
                {member.fullName} ({member.role})
              </p>
              <p className="text-xs text-zinc-600">{member.email}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
