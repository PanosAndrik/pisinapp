import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

const DEFAULT_COMPANY_NAME = "Pisinapp Demo Company";

export async function ensureDefaultCompany() {
  const existing = await prisma.company.findFirst({
    where: { name: DEFAULT_COMPANY_NAME },
    select: { id: true, name: true },
  });

  if (existing) return existing;

  return prisma.company.create({
    data: { name: DEFAULT_COMPANY_NAME },
    select: { id: true, name: true },
  });
}

export async function ensureBootstrapAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD?.trim();
  const fullName = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Owner Admin";

  if (!email || !password) return;

  const company = await ensureDefaultCompany();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return;

  await prisma.user.create({
    data: {
      email,
      fullName,
      passwordHash: hashPassword(password),
      role: "ADMIN",
      companyId: company.id,
    },
  });
}
