/**
 * Resolves the effective markup for a product.
 *
 * Priority: product.markupOverride → category.defaultMarkup → dropShipper.defaultMarkup → 0.20
 */
export function resolveMarkup(
  markupOverride: number | null | undefined,
  categoryDefaultMarkup: number | null | undefined,
  dropShipperDefaultMarkup: number | null | undefined
): number {
  if (markupOverride !== null && markupOverride !== undefined) return markupOverride;
  if (categoryDefaultMarkup !== null && categoryDefaultMarkup !== undefined) return categoryDefaultMarkup;
  if (dropShipperDefaultMarkup !== null && dropShipperDefaultMarkup !== undefined) return dropShipperDefaultMarkup;
  return 0.2;
}

/**
 * Calculates the customer-facing selling price.
 */
export function calculateSellingPrice(wholesalePrice: number, markup: number): number {
  return Math.round(wholesalePrice * (1 + markup) * 100) / 100;
}
