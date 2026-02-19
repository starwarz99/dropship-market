"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { resolveMarkup, calculateSellingPrice } from "@/lib/pricing";
import { generateUniqueProductSlug } from "@/lib/slugify";

/**
 * Publish a DropShipperProduct as a curated storefront Product.
 */
export async function publishProduct(formData: FormData) {
  const dropShipperProductId = formData.get("dropShipperProductId") as string;
  const categoryId = (formData.get("categoryId") as string) || null;
  const markupOverrideRaw = formData.get("markupOverride") as string;
  const markupOverride = markupOverrideRaw ? parseFloat(markupOverrideRaw) / 100 : null;
  const isFeatured = formData.get("isFeatured") === "true";

  const dsp = await prisma.dropShipperProduct.findUnique({
    where: { id: dropShipperProductId },
    include: {
      dropShipper: true,
      product: true,
    },
  });

  if (!dsp) throw new Error("Drop-shipper product not found");
  if (dsp.product) throw new Error("Product already published");

  const category = categoryId
    ? await prisma.category.findUnique({ where: { id: categoryId } })
    : null;

  const markup = resolveMarkup(markupOverride, category?.defaultMarkup, dsp.dropShipper.defaultMarkup);
  const sellingPrice = calculateSellingPrice(dsp.wholesalePrice, markup);
  const slug = await generateUniqueProductSlug(dsp.title);

  await prisma.product.create({
    data: {
      dropShipperProductId: dsp.id,
      categoryId,
      name: dsp.title,
      slug,
      description: dsp.description,
      imageUrls: dsp.imageUrls,
      markupOverride,
      sellingPrice,
      isVisible: true,
      isFeatured,
    },
  });

  revalidatePath("/admin/catalog");
  revalidatePath("/");
  revalidatePath("/products");
}

/**
 * Toggle product visibility.
 */
export async function toggleProductVisibility(formData: FormData) {
  const id = formData.get("id") as string;
  const isVisible = formData.get("isVisible") === "true";

  await prisma.product.update({ where: { id }, data: { isVisible } });

  revalidatePath("/admin/catalog");
  revalidatePath("/");
  revalidatePath("/products");
}

/**
 * Toggle featured flag.
 */
export async function toggleProductFeatured(formData: FormData) {
  const id = formData.get("id") as string;
  const isFeatured = formData.get("isFeatured") === "true";

  await prisma.product.update({ where: { id }, data: { isFeatured } });

  revalidatePath("/admin/catalog");
  revalidatePath("/");
}

/**
 * Update markup override and recalculate selling price.
 */
export async function updateProductMarkup(formData: FormData) {
  const id = formData.get("id") as string;
  const markupOverrideRaw = formData.get("markupOverride") as string;
  const markupOverride = markupOverrideRaw ? parseFloat(markupOverrideRaw) / 100 : null;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      dropShipperProduct: { include: { dropShipper: true } },
    },
  });

  if (!product) return;

  const markup = resolveMarkup(
    markupOverride,
    product.category?.defaultMarkup,
    product.dropShipperProduct.dropShipper.defaultMarkup
  );
  const sellingPrice = calculateSellingPrice(product.dropShipperProduct.wholesalePrice, markup);

  await prisma.product.update({
    where: { id },
    data: { markupOverride, sellingPrice },
  });

  revalidatePath("/admin/catalog");
}

/**
 * Unpublish (delete) a curated product, returning it to the pending catalog.
 */
export async function unpublishProduct(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/catalog");
  revalidatePath("/");
  revalidatePath("/products");
}
