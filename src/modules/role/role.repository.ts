import prisma from "@/common/db/prisma";
import { Role } from "@prisma/client";

export const findByName = async (name: string): Promise<Role | null> => {
  const role = await prisma.role.findUnique({ where: { name } });
  return role as Role | null;
};

export const findByUserRoles = async (userId: string): Promise<Role[]> => {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return userRoles.map((ur) => ur.role) as Role[];
};

export const assignRoleToUser = async (
  userId: string,
  roleId: string,
): Promise<void> => {
  await prisma.userRole.create({
    data: { userId, roleId },
  });
};
