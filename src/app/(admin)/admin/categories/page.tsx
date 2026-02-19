import { prisma } from "@/lib/prisma";
import { CategoryForm } from "./CategoryForm";
import { deleteCategory } from "./actions";
import { Button } from "@/components/ui/button";

async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Categories</h1>
        <CategoryForm />
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-gray-600">Name</th>
              <th className="text-left p-4 text-sm font-medium text-gray-600">Slug</th>
              <th className="text-left p-4 text-sm font-medium text-gray-600">Default Markup</th>
              <th className="text-left p-4 text-sm font-medium text-gray-600">Products</th>
              <th className="text-right p-4 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{cat.name}</td>
                <td className="p-4 text-gray-500 font-mono text-sm">{cat.slug}</td>
                <td className="p-4">{(cat.defaultMarkup * 100).toFixed(0)}%</td>
                <td className="p-4 text-gray-600">{cat._count.products}</td>
                <td className="p-4 text-right">
                  <form action={deleteCategory} className="inline">
                    <input type="hidden" name="id" value={cat.id} />
                    <Button type="submit" variant="destructive" size="sm">
                      Delete
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
