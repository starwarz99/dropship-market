export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";

async function getFeaturedProducts() {
  return prisma.product.findMany({
    where: { isVisible: true, isFeatured: true },
    include: { category: true },
    take: 8,
    orderBy: { createdAt: "desc" },
  });
}

async function getCategories() {
  return prisma.category.findMany({ take: 6, orderBy: { name: "asc" } });
}

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-700 text-white py-24 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Premium Products,
            <br />
            Direct to You
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-xl mx-auto">
            Curated dropshipping marketplace with thousands of quality products from verified suppliers.
          </p>
          <Button asChild size="lg" className="text-base">
            <Link href="/products">Shop Now</Link>
          </Button>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold mb-8">Browse Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat: typeof categories[number]) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="flex flex-col items-center p-4 rounded-xl border hover:border-primary hover:shadow-md transition-all text-center"
              >
                <span className="text-sm font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="container mx-auto px-4 py-8 pb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <Button asChild variant="outline">
              <Link href="/products">View All</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featured.map((p: typeof featured[number]) => (
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
        </section>
      )}

      {featured.length === 0 && categories.length === 0 && (
        <section className="container mx-auto px-4 py-32 text-center text-gray-500">
          <p className="text-lg">Products coming soon. Check back shortly!</p>
        </section>
      )}
    </div>
  );
}
