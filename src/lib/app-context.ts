import { prisma } from "@/lib/prisma";

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
