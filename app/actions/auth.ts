"use server";

import prisma from "@/lib/prisma";

export async function checkAdminAccess(email: string) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (admin) {
      await prisma.admin.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error("Erreur checkAdminAccess:", error);
    return false;
  }
}
