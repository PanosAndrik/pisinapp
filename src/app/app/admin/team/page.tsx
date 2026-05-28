import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";

import { hashPassword, requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function addTechnician(formData: FormData) {
  "use server";

  const session = await requireAdminSession();
  const targetCompanyIdRaw = String(formData.get("companyId") ?? "").trim();
  const companyId =
    session.role === "SUPER_ADMIN" && targetCompanyIdRaw ? targetCompanyIdRaw : session.companyId;
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  if (!fullName || !email || !password) return;

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

  revalidatePath("/app/admin/team");
}

async function resetTechnicianCredentials(formData: FormData) {
  "use server";

  const session = await requireAdminSession();
  const userId = String(formData.get("userId") ?? "").trim();
  const companyIdFromForm = String(formData.get("companyId") ?? "").trim();
  const companyId =
    session.role === "SUPER_ADMIN" && companyIdFromForm ? companyIdFromForm : session.companyId;

  if (!userId) return;

  const target = await prisma.user.findFirst({
    where: { id: userId, companyId, role: "TECHNICIAN" },
    select: { id: true },
  });
  if (!target) return;

  const tempPassword = randomBytes(9).toString("base64url");
  await prisma.user.update({
    where: { id: target.id },
    data: { passwordHash: hashPassword(tempPassword), isActive: true },
  });

  revalidatePath("/app/admin/team");
  redirect(
    `/app/admin/team?companyId=${encodeURIComponent(companyId)}&revealUserId=${encodeURIComponent(userId)}&revealPassword=${encodeURIComponent(tempPassword)}`,
  );
}

async function updateTechnicianCredentials(formData: FormData) {
  "use server";

  const session = await requireAdminSession();
  const userId = String(formData.get("userId") ?? "").trim();
  const companyIdFromForm = String(formData.get("companyId") ?? "").trim();
  const companyId =
    session.role === "SUPER_ADMIN" && companyIdFromForm ? companyIdFromForm : session.companyId;
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  if (!userId || !fullName || !email) return;

  const target = await prisma.user.findFirst({
    where: { id: userId, companyId, role: "TECHNICIAN" },
    select: { id: true },
  });
  if (!target) return;

  await prisma.user.update({
    where: { id: target.id },
    data: {
      fullName,
      email,
      ...(password ? { passwordHash: hashPassword(password) } : {}),
      isActive: true,
    },
  });

  revalidatePath("/app/admin/team");
}

type AdminTeamPageProps = {
  searchParams: Promise<{ companyId?: string; revealUserId?: string; revealPassword?: string }>;
};

export default async function AdminTeamPage({ searchParams }: AdminTeamPageProps) {
  const session = await requireAdminSession();
  const params = await searchParams;
  const companyId =
    session.role === "SUPER_ADMIN" && params.companyId ? params.companyId : session.companyId;
  const members = await prisma.user.findMany({
    where: { companyId, isActive: true },
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
    select: { id: true, fullName: true, email: true, role: true },
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="text-3xl font-semibold text-zinc-900">Διαχειριση Ομαδας</h1>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Προσθηκη Τεχνικου</h2>
        <form action={addTechnician} className="mt-4 grid gap-3 sm:grid-cols-2">
          {session.role === "SUPER_ADMIN" ? <input type="hidden" name="companyId" value={companyId} /> : null}
          <input
            name="fullName"
            placeholder="Ονομα τεχνικου"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
          <input
            name="email"
            type="email"
            placeholder="Email τεχνικου"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
          <input
            name="password"
            type="password"
            placeholder="Προσωρινος κωδικος"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2 sm:col-span-2"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 sm:col-span-2"
          >
            Προσθηκη τεχνικου
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-900">Ενεργοι χρηστες</h2>
        <div className="mt-4 space-y-2">
          {members.map((member) => (
            <div key={member.id} className="rounded-lg border border-zinc-200 px-3 py-2">
              <p className="text-sm font-medium text-zinc-900">
                {member.fullName} ({member.role})
              </p>
              <p className="text-xs text-zinc-600">{member.email}</p>
              {member.role === "TECHNICIAN" ? (
                <>
                  <form action={updateTechnicianCredentials} className="mt-2 grid gap-2">
                    <input type="hidden" name="userId" value={member.id} />
                    <input type="hidden" name="companyId" value={companyId} />
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
                  <form action={resetTechnicianCredentials} className="mt-2">
                    <input type="hidden" name="userId" value={member.id} />
                    <input type="hidden" name="companyId" value={companyId} />
                    <button
                      type="submit"
                      className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-800 hover:bg-zinc-100"
                    >
                      Επαναφορα στοιχειων
                    </button>
                  </form>
                </>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
