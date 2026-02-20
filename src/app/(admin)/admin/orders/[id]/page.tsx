import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { updateOrderStatus } from "../actions";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      orderItems: {
        include: {
          product: true,
          payout: true,
        },
      },
    },
  });

  if (!order) notFound();

  const address = order.shippingAddress as Record<string, string>;

  return (
    <div>
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/admin/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </Button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Order #{id.slice(-8)}</h1>
          <p className="text-gray-500 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <form action={updateOrderStatus} className="flex gap-2">
          <input type="hidden" name="id" value={id} />
          <select name="status" defaultValue={order.status} className="border rounded px-3 py-2">
            {["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <Button type="submit">Update Status</Button>
        </form>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="border rounded-xl p-6">
          <h2 className="font-semibold mb-3">Customer</h2>
          <p className="font-medium">{order.user.name}</p>
          <p className="text-gray-500">{order.user.email}</p>
        </div>
        <div className="border rounded-xl p-6">
          <h2 className="font-semibold mb-3">Shipping Address</h2>
          {Object.keys(address).length > 0 ? (
            <div className="text-gray-600 space-y-1 text-sm">
              {address.name && <p>{address.name}</p>}
              {address.line1 && <p>{address.line1}</p>}
              {address.line2 && <p>{address.line2}</p>}
              {(address.city || address.state || address.postalCode) && (
                <p>{[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}</p>
              )}
              {address.country && <p>{address.country}</p>}
            </div>
          ) : (
            <p className="text-gray-500">Not provided</p>
          )}
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-medium text-gray-600">Product</th>
              <th className="text-left p-4 font-medium text-gray-600">Qty</th>
              <th className="text-left p-4 font-medium text-gray-600">Unit Price</th>
              <th className="text-left p-4 font-medium text-gray-600">Wholesale</th>
              <th className="text-left p-4 font-medium text-gray-600">Subtotal</th>
              <th className="text-left p-4 font-medium text-gray-600">Payout</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.orderItems.map((item: typeof order.orderItems[number]) => (
              <tr key={item.id}>
                <td className="p-4 font-medium">{item.product.name}</td>
                <td className="p-4">{item.quantity}</td>
                <td className="p-4">${item.unitPrice.toFixed(2)}</td>
                <td className="p-4 text-gray-500">${item.wholesalePrice.toFixed(2)}</td>
                <td className="p-4">${(item.unitPrice * item.quantity).toFixed(2)}</td>
                <td className="p-4">
                  {item.payout ? (
                    <Badge
                      variant={
                        item.payout.status === "COMPLETED"
                          ? "default"
                          : item.payout.status === "FAILED"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {item.payout.status}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-8">
            <span className="text-gray-600">Subtotal</span>
            <span>${order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-8 font-bold text-base">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
