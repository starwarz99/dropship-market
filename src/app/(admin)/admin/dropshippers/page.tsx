import { prisma } from "@/lib/prisma";
import { DropShipperForm } from "./DropShipperForm";
import { Badge } from "@/components/ui/badge";
import { deleteDropShipper, toggleDropShipper } from "./actions";
import { Button } from "@/components/ui/button";
import { randomBytes } from "crypto";

async function getDropShippers() {
  return prisma.dropShipper.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { products: true } } },
  });
}

export default async function DropShippersPage() {
  const dropShippers = await getDropShippers();
  const defaultSecret = randomBytes(32).toString("hex");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Drop-Shippers</h1>
        <DropShipperForm defaultSecret={defaultSecret} />
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-gray-600">Name</th>
              <th className="text-left p-4 text-sm font-medium text-gray-600">Products</th>
              <th className="text-left p-4 text-sm font-medium text-gray-600">Default Markup</th>
              <th className="text-left p-4 text-sm font-medium text-gray-600">Stripe Account</th>
              <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
              <th className="text-left p-4 text-sm font-medium text-gray-600">Webhook URL</th>
              <th className="text-right p-4 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {dropShippers.map((ds: typeof dropShippers[number]) => (
              <tr key={ds.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{ds.name}</td>
                <td className="p-4 text-gray-600">{ds._count.products}</td>
                <td className="p-4">{(ds.defaultMarkup * 100).toFixed(0)}%</td>
                <td className="p-4 text-sm text-gray-500">
                  {ds.stripeAccountId ?? "—"}
                </td>
                <td className="p-4">
                  <Badge variant={ds.isActive ? "default" : "secondary"}>
                    {ds.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="p-4">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    /api/webhooks/dropshipper/{ds.id}
                  </code>
                </td>
                <td className="p-4 text-right space-x-2">
                  <form action={toggleDropShipper} className="inline">
                    <input type="hidden" name="id" value={ds.id} />
                    <input type="hidden" name="isActive" value={String(!ds.isActive)} />
                    <Button type="submit" variant="outline" size="sm">
                      {ds.isActive ? "Disable" : "Enable"}
                    </Button>
                  </form>
                  <form action={deleteDropShipper} className="inline">
                    <input type="hidden" name="id" value={ds.id} />
                    <Button type="submit" variant="destructive" size="sm">
                      Delete
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
            {dropShippers.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No drop-shippers yet. Add one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
