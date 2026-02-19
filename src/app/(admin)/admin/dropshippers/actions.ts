"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createDropShipper(formData: FormData) {
  const name = formData.get("name") as string;
  const webhookSecret = formData.get("webhookSecret") as string;
  const stripeAccountId = (formData.get("stripeAccountId") as string) || null;
  const defaultMarkup = parseFloat(formData.get("defaultMarkup") as string) / 100;

  await prisma.dropShipper.create({
    data: { name, webhookSecret, stripeAccountId, defaultMarkup },
  });

  revalidatePath("/admin/dropshippers");
}

export async function deleteDropShipper(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.dropShipper.delete({ where: { id } });
  revalidatePath("/admin/dropshippers");
}

export async function toggleDropShipper(formData: FormData) {
  const id = formData.get("id") as string;
  const isActive = formData.get("isActive") === "true";
  await prisma.dropShipper.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/dropshippers");
}
