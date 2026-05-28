import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";

import { hashPassword, requireSuperAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function createCompanyWithBoss(formData: FormData) {
  "use server";

  await requireSuperAdminSession();

  const companyName = String(formData.get("companyName") ?? "").trim();
  const bossName = String(formData.get("bossName") ?? "").trim();
  const bossEmail = String(formData.get("bossEmail") ?? "").trim().toLowerCase();
  const bossPassword = String(formData.get("bossPassword") ?? "").trim();

  if (!companyName || !bossName || !bossEmail || !bossPassword) return;

  await prisma.company.create({
    data: {
      name: companyName,
      users: {
        create: {
          fullName: bossName,
          email: bossEmail,
          passwordHash: hashPassword(bossPassword),
          role: "ADMIN",
          isActive: true,
        },
      },
    },
  });

  revalidatePath("/app/super-admin");
}

async function addTechnician(formData: FormData) {
  "use server";

  await requireSuperAdminSession();

  const companyId = String(formData.get("companyId") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  if (!companyId || !fullName || !email || !password) return;

  await prisma.user.create({
    data: {
      companyId,
      fullName,
      email,
      passwordHash: hashPassword(password),
      role: "TECHNICIAN",
      isActive: true,
    },
  });

  revalidatePath("/app/super-admin");
}

async function deleteCompany(formData: FormData) {
  "use server";

  const session = await requireSuperAdminSession();
  const companyId = String(formData.get("companyId") ?? "").trim();
  if (!companyId) return;

  // Prevent deleting the company that currently contains the logged-in super admin.
  if (companyId === session.companyId) return;

  await prisma.company.delete({
    where: { id: companyId },
  });

  revalidatePath("/app/super-admin");
}

async function resetAnyUserPassword(formData: FormData) {
  "use server";

  await requireSuperAdminSession();

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) return;

  const tempPassword = randomBytes(9).toString("base64url");
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashPassword(tempPassword), isActive: true },
  });

  revalidatePath("/app/super-admin");
  redirect(`/app/super-admin?revealUserId=${encodeURIComponent(userId)}&revealPassword=${encodeURIComponent(tempPassword)}`);
}

type SuperAdminPageProps = {
  searchParams: Promise<{ revealUserId?: string; revealPassword?: string }>;
};

export default async function SuperAdminPage({ searchParams }: SuperAdminPageProps) {
  const session = await requireSuperAdminSession();
  const params = await searchParams;

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: {
        where: { isActive: true },
        orderBy: [{ role: "asc" }, { fullName: "asc" }],
        select: { id: true, fullName: true, email: true, role: true },
      },
      _count: { select: { pools: true, visits: true } },
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-3xl font-semibold text-zinc-900">Super Admin</h1>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Create company + boss account</h2>
        <form action={createCompanyWithBoss} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            name="companyName"
            placeholder="Company name"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2 sm:col-span-2"
          />
          <input
            name="bossName"
            placeholder="Boss full name"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
          <input
            name="bossEmail"
            type="email"
            placeholder="Boss email"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
          <input
            name="bossPassword"
            type="password"
            placeholder="Boss password"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2 sm:col-span-2"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 sm:col-span-2"
          >
            Create company
          </button>
        </form>
      </section>

      <section className="space-y-4">
        {companies.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-600 shadow-sm">
            No companies yet.
          </div>
        ) : (
          companies.map((company) => (
            <article key={company.id} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900">{company.name}</h3>
                  <p className="text-sm text-zinc-600">
                    Pools: {company._count.pools} | Visits: {company._count.visits}
                  </p>
                </div>
                <form action={deleteCompany}>
                  <input type="hidden" name="companyId" value={company.id} />
                  <button
                    type="submit"
                    disabled={company.id === session.companyId}
                    className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete company
                  </button>
                </form>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                    Team members
                  </h4>
                  <div className="mt-2 space-y-2">
                    {company.users.length === 0 ? (
                      <p className="text-sm text-zinc-600">No active users.</p>
                    ) : (
                      company.users.map((member) => (
                        <div key={member.id} className="rounded-lg border border-zinc-200 px-3 py-2">
                          <p className="text-sm font-medium text-zinc-900">
                            {member.fullName} ({member.role})
                          </p>
                          <p className="text-xs text-zinc-600">{member.email}</p>
                          {params.revealUserId === member.id && params.revealPassword ? (
                            <p className="mt-1 text-xs font-medium text-green-700">
                              Temporary password: {params.revealPassword}
                            </p>
                          ) : null}
                          <form action={resetAnyUserPassword} className="mt-2">
                            <input type="hidden" name="userId" value={member.id} />
                            <button
                              type="submit"
                              className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-800 hover:bg-zinc-100"
                            >
                              Reset credentials
                            </button>
                          </form>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                    Add technician
                  </h4>
                  <form action={addTechnician} className="mt-2 space-y-2">
                    <input type="hidden" name="companyId" value={company.id} />
                    <input
                      name="fullName"
                      placeholder="Technician name"
                      required
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                    />
                    <input
                      name="email"
                      type="email"
                      placeholder="Technician email"
                      required
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                    />
                    <input
                      name="password"
                      type="password"
                      placeholder="Temporary password"
                      required
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                    >
                      Add technician
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
