import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      orderItems: {
        include: { product: { select: { name: true, imageUrls: true, slug: true } } },
      },
    },
  });

  if (!order || order.userId !== session.user.id) notFound();

  const address = order.shippingAddress as Record<string, string>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </Button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Order #{id.slice(-8)}</h1>
          <p className="text-gray-500 mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge>{order.status}</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {Object.keys(address).length > 0 && (
          <div className="border rounded-xl p-6">
            <h2 className="font-semibold mb-3">Shipping Address</h2>
            <div className="text-gray-600 space-y-1 text-sm">
              {address.name && <p>{address.name}</p>}
              {address.line1 && <p>{address.line1}</p>}
              {address.line2 && <p>{address.line2}</p>}
              {(address.city || address.state) && (
                <p>{[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}</p>
              )}
              {address.country && <p>{address.country}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="border rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-medium text-gray-600">Product</th>
              <th className="text-left p-4 font-medium text-gray-600">Qty</th>
              <th className="text-left p-4 font-medium text-gray-600">Price</th>
              <th className="text-right p-4 font-medium text-gray-600">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.orderItems.map((item: typeof order.orderItems[number]) => (
              <tr key={item.id}>
                <td className="p-4">
                  <Link href={`/products/${item.product.slug}`} className="font-medium hover:underline">
                    {item.product.name}
                  </Link>
                </td>
                <td className="p-4">{item.quantity}</td>
                <td className="p-4">${item.unitPrice.toFixed(2)}</td>
                <td className="p-4 text-right">${(item.unitPrice * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-8 font-bold text-base">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
