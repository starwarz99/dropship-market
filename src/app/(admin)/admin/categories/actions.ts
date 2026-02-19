"use server";

import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { revalidatePath } from "next/cache";

export async function createCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const defaultMarkup = parseFloat(formData.get("defaultMarkup") as string) / 100;
  const imageUrl = (formData.get("imageUrl") as string) || null;

  const slug = slugify(name);

  await prisma.category.upsert({
    where: { slug },
    create: { name, slug, defaultMarkup, imageUrl },
    update: { defaultMarkup, imageUrl },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/products");
}

export async function deleteCategory(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
}
