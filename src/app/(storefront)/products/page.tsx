export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ search?: string; category?: string }>;
}

async function getProducts(search?: string, categorySlug?: string) {
  const category = categorySlug
    ? await prisma.category.findUnique({ where: { slug: categorySlug } })
    : null;

  return prisma.product.findMany({
    where: {
      isVisible: true,
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(category ? { categoryId: category.id } : {}),
    },
    include: { category: true },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 48,
  });
}

async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { search, category: categorySlug } = params;
  const [products, categories] = await Promise.all([
    getProducts(search, categorySlug),
    getCategories(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">All Products</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <form className="flex gap-2 flex-1">
          <Input
            name="search"
            placeholder="Search products..."
            defaultValue={search}
            className="max-w-sm"
          />
          {categorySlug && <input type="hidden" name="category" value={categorySlug} />}
          <Button type="submit" variant="outline">Search</Button>
        </form>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant={!categorySlug ? "default" : "outline"}
              size="sm"
            >
              <Link href="/products">All</Link>
            </Button>
            {categories.map((cat: typeof categories[number]) => (
              <Button
                key={cat.id}
                asChild
                variant={categorySlug === cat.slug ? "default" : "outline"}
                size="sm"
              >
                <Link href={`/products?category=${cat.slug}${search ? `&search=${search}` : ""}`}>
                  {cat.name}
                </Link>
              </Button>
            ))}
          </div>
        )}
      </div>

      {products.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg">No products found. Try a different search or category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p: typeof products[number]) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              slug={p.slug}
              price={p.sellingPrice}
              imageUrl={p.imageUrls[0] ?? ""}
              isFeatured={p.isFeatured}
              categoryName={p.category?.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
