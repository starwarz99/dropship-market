import slugifyLib from "slugify";
import { prisma } from "./prisma";

export function slugify(text: string): string {
  return slugifyLib(text, {
    lower: true,
    strict: true,
    trim: true,
  });
}

/**
 * Generates a unique slug by appending a numeric suffix if the base slug already exists.
 */
export async function generateUniqueProductSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let count = 1;

  while (true) {
    const existing = await prisma.product.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    if (!existing) return slug;
    slug = `${base}-${count++}`;
  }
}
