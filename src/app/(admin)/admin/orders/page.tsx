import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { updateOrderStatus } from "./actions";

const statusColors: Record<string, string> = {
  PENDING: "secondary",
  PAID: "default",
  PROCESSING: "default",
  SHIPPED: "default",
  DELIVERED: "default",
  CANCELLED: "destructive",
  REFUNDED: "secondary",
};

async function getOrders() {
  return prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { orderItems: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Orders</h1>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-medium text-gray-600">Order ID</th>
              <th className="text-left p-4 font-medium text-gray-600">Customer</th>
              <th className="text-left p-4 font-medium text-gray-600">Items</th>
              <th className="text-left p-4 font-medium text-gray-600">Total</th>
              <th className="text-left p-4 font-medium text-gray-600">Status</th>
              <th className="text-left p-4 font-medium text-gray-600">Date</th>
              <th className="text-right p-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs text-primary hover:underline">
                    {order.id.slice(-8)}
                  </Link>
                </td>
                <td className="p-4">
                  <div>{order.user.name}</div>
                  <div className="text-gray-500 text-xs">{order.user.email}</div>
                </td>
                <td className="p-4">{order._count.orderItems}</td>
                <td className="p-4 font-medium">${order.total.toFixed(2)}</td>
                <td className="p-4">
                  <Badge variant={statusColors[order.status] as "default" | "secondary" | "destructive" ?? "secondary"}>
                    {order.status}
                  </Badge>
                </td>
                <td className="p-4 text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 text-right">
                  <form action={updateOrderStatus} className="inline-flex gap-2">
                    <input type="hidden" name="id" value={order.id} />
                    <select
                      name="status"
                      defaultValue={order.status}
                      className="text-xs border rounded px-2 py-1"
                    >
                      {["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <Button type="submit" size="sm" variant="outline">Update</Button>
                  </form>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
