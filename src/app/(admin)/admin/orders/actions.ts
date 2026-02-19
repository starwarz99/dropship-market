"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateOrderStatus(formData: FormData) {
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.order.update({ where: { id }, data: { status: status as any } });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}
