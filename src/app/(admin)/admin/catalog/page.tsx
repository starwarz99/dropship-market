import { prisma } from "@/lib/prisma";
import { PublishProductDialog } from "./PublishProductDialog";
import {
  toggleProductVisibility,
  toggleProductFeatured,
  unpublishProduct,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

async function getUnpublishedProducts() {
  return prisma.dropShipperProduct.findMany({
    where: { product: null },
    include: { dropShipper: true },
    orderBy: { createdAt: "desc" },
  });
}

async function getPublishedProducts() {
  return prisma.product.findMany({
    include: {
      category: true,
      dropShipperProduct: { include: { dropShipper: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export default async function CatalogPage() {
  const [unpublished, published, categories] = await Promise.all([
    getUnpublishedProducts(),
    getPublishedProducts(),
    getCategories(),
  ]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Catalog Management</h1>

      {/* Unpublished / pending products */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">
          Pending Products ({unpublished.length})
        </h2>

        {unpublished.length === 0 ? (
          <p className="text-gray-500">No pending products. Waiting for drop-shipper webhooks.</p>
        ) : (
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Title</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Drop-Shipper</th>
                  <th className="text-left p-4 text-sm font-medium text-gray-600">Wholesale</th>
                  <th className="text-right p-4 text-sm font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {unpublished.map((dsp: typeof unpublished[number]) => (
                  <tr key={dsp.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium">{dsp.title}</td>
                    <td className="p-4 text-gray-600">{dsp.dropShipper.name}</td>
                    <td className="p-4">${dsp.wholesalePrice.toFixed(2)}</td>
                    <td className="p-4 text-right">
                      <PublishProductDialog
                        dsp={dsp}
                        categories={categories}
                        defaultMarkup={dsp.dropShipper.defaultMarkup}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Published products */}
      <section>
        <h2 className="text-xl font-semibold mb-4">
          Published Products ({published.length})
        </h2>

        {published.length === 0 ? (
          <p className="text-gray-500">No published products yet.</p>
        ) : (
          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Name</th>
                  <th className="text-left p-4 font-medium text-gray-600">Category</th>
                  <th className="text-left p-4 font-medium text-gray-600">Price</th>
                  <th className="text-left p-4 font-medium text-gray-600">Markup</th>
                  <th className="text-left p-4 font-medium text-gray-600">Status</th>
                  <th className="text-right p-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {published.map((p: typeof published[number]) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium">{p.name}</td>
                    <td className="p-4 text-gray-600">{p.category?.name ?? "—"}</td>
                    <td className="p-4">${p.sellingPrice.toFixed(2)}</td>
                    <td className="p-4 text-gray-500">
                      {p.markupOverride !== null
                        ? `${(p.markupOverride! * 100).toFixed(0)}% (override)`
                        : `${((p.sellingPrice / p.dropShipperProduct.wholesalePrice - 1) * 100).toFixed(0)}% (inherited)`}
                    </td>
                    <td className="p-4 space-x-1">
                      <Badge variant={p.isVisible ? "default" : "secondary"}>
                        {p.isVisible ? "Visible" : "Hidden"}
                      </Badge>
                      {p.isFeatured && <Badge className="bg-yellow-500">Featured</Badge>}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <form action={toggleProductVisibility} className="inline">
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="isVisible" value={String(!p.isVisible)} />
                        <Button type="submit" variant="outline" size="sm">
                          {p.isVisible ? "Hide" : "Show"}
                        </Button>
                      </form>
                      <form action={toggleProductFeatured} className="inline">
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="isFeatured" value={String(!p.isFeatured)} />
                        <Button type="submit" variant="outline" size="sm">
                          {p.isFeatured ? "Unfeature" : "Feature"}
                        </Button>
                      </form>
                      <form action={unpublishProduct} className="inline">
                        <input type="hidden" name="id" value={p.id} />
                        <Button type="submit" variant="destructive" size="sm">
                          Unpublish
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
