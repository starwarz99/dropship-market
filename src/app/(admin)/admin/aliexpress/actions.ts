"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { AliProduct } from "@/lib/aliexpress";

export async function importAliExpressProduct(product: AliProduct) {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  // Ensure the built-in AliExpress drop-shipper exists
  await prisma.dropShipper.upsert({
    where: { id: "aliexpress-builtin" },
    create: {
      id: "aliexpress-builtin",
      name: "AliExpress",
      defaultMarkup: 0.35,
      webhookSecret: "aliexpress-managed",
    },
    update: {},
  });

  // Normalize image URL
  let imageUrl = product.imageUrl;
  if (imageUrl.startsWith("//")) imageUrl = `https:${imageUrl}`;

  await prisma.dropShipperProduct.upsert({
    where: {
      dropShipperId_externalId: {
        dropShipperId: "aliexpress-builtin",
        externalId: product.id,
      },
    },
    create: {
      dropShipperId: "aliexpress-builtin",
      externalId: product.id,
      title: product.title,
      wholesalePrice: product.salePrice,
      imageUrls: [imageUrl],
      rawData: {
        originalPrice: product.originalPrice,
        currency: product.currency,
        detailUrl: product.detailUrl,
        category: product.category,
        rating: product.rating,
      },
    },
    update: {
      title: product.title,
      wholesalePrice: product.salePrice,
      imageUrls: [imageUrl],
      rawData: {
        originalPrice: product.originalPrice,
        currency: product.currency,
        detailUrl: product.detailUrl,
        category: product.category,
        rating: product.rating,
      },
    },
  });

  revalidatePath("/admin/catalog");
  revalidatePath("/admin/aliexpress");
  return { success: true };
}
