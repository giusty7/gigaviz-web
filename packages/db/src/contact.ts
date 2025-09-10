import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma =
  g.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
if (process.env.NODE_ENV !== "production") g.prisma = prisma;

export async function listContacts(limit = 100) {
  return prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      message: true,
      via: true,
      ip: true,
      ua: true,
      createdAt: true,
    },
  });
}

export async function countContacts() {
  return prisma.contactMessage.count();
}

export async function deleteContact(id: string) {
  await prisma.contactMessage.delete({ where: { id } });
}
