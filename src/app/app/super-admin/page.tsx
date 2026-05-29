import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { cardClass, fieldClass } from "@/components/ui/field-styles";
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

async function updateAnyUserCredentials(formData: FormData) {
  "use server";

  await requireSuperAdminSession();

  const userId = String(formData.get("userId") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  if (!userId || !fullName || !email) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      fullName,
      email,
      ...(password ? { passwordHash: hashPassword(password) } : {}),
      isActive: true,
    },
  });

  revalidatePath("/app/super-admin");
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
    <PageShell>
      <PageHeader title="Υπερ Διαχειριση" backHref="/app" backLabel="Πισω στην αρχικη" />

      <section className={cardClass}>
        <h2 className="text-xl font-semibold text-zinc-900">Δημιουργια εταιρειας + λογαριασμου boss</h2>
        <form action={createCompanyWithBoss} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            name="companyName"
            placeholder="Ονομα εταιρειας"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2 sm:col-span-2"
          />
          <input
            name="bossName"
            placeholder="Ονοματεπωνυμο boss"
            required
            className={fieldClass}
          />
          <input
            name="bossEmail"
            type="email"
            placeholder="Email boss"
            required
            className={fieldClass}
          />
          <input
            name="bossPassword"
            type="password"
            placeholder="Κωδικος boss"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2 sm:col-span-2"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 sm:col-span-2"
          >
            Δημιουργια εταιρειας
          </button>
        </form>
      </section>

      <section className="space-y-4">
        {companies.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-600 shadow-sm">
            Δεν υπαρχουν εταιρειες ακομα.
          </div>
        ) : (
          companies.map((company) => (
            <article key={company.id} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900">{company.name}</h3>
                  <p className="text-sm text-zinc-600">
                    Πισινες: {company._count.pools} | Επισκεψεις: {company._count.visits}
                  </p>
                </div>
                <form action={deleteCompany}>
                  <input type="hidden" name="companyId" value={company.id} />
                  <button
                    type="submit"
                    disabled={company.id === session.companyId}
                    className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Διαγραφη εταιρειας
                  </button>
                </form>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                    Μελη ομαδας
                  </h4>
                  <div className="mt-2 space-y-2">
                    {company.users.length === 0 ? (
                      <p className="text-sm text-zinc-600">Δεν υπαρχουν ενεργοι χρηστες.</p>
                    ) : (
                      company.users.map((member) => (
                        <div key={member.id} className="rounded-lg border border-zinc-200 px-3 py-2">
                          <p className="text-sm font-medium text-zinc-900">
                            {member.fullName} ({member.role})
                          </p>
                          <p className="text-xs text-zinc-600">{member.email}</p>
                          <form action={updateAnyUserCredentials} className="mt-2 grid gap-2">
                            <input type="hidden" name="userId" value={member.id} />
                            <input
                              name="fullName"
                              defaultValue={member.fullName}
                              className="rounded border border-zinc-300 px-2 py-1 text-xs"
                            />
                            <input
                              name="email"
                              type="email"
                              defaultValue={member.email}
                              className="rounded border border-zinc-300 px-2 py-1 text-xs"
                            />
                            <input
                              name="password"
                              type="text"
                              placeholder="Νεος κωδικος (προαιρετικο)"
                              className="rounded border border-zinc-300 px-2 py-1 text-xs"
                            />
                            <button
                              type="submit"
                              className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-800 hover:bg-zinc-100"
                            >
                              Αποθηκευση στοιχειων
                            </button>
                          </form>
                          {params.revealUserId === member.id && params.revealPassword ? (
                            <p className="mt-1 text-xs font-medium text-green-700">
                              Προσωρινος κωδικος: {params.revealPassword}
                            </p>
                          ) : null}
                          <form action={resetAnyUserPassword} className="mt-2">
                            <input type="hidden" name="userId" value={member.id} />
                            <button
                              type="submit"
                              className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-800 hover:bg-zinc-100"
                            >
                              Επαναφορα στοιχειων
                            </button>
                          </form>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                    Προσθηκη τεχνικου
                  </h4>
                  <form action={addTechnician} className="mt-2 space-y-2">
                    <input type="hidden" name="companyId" value={company.id} />
                    <input
                      name="fullName"
                      placeholder="Ονομα τεχνικου"
                      required
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                    />
                    <input
                      name="email"
                      type="email"
                      placeholder="Email τεχνικου"
                      required
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                    />
                    <input
                      name="password"
                      type="password"
                      placeholder="Προσωρινος κωδικος"
                      required
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                    >
                      Προσθηκη τεχνικου
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </PageShell>
  );
}
