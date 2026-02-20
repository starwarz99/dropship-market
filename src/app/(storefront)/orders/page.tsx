import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    include: { _count: { select: { orderItems: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/orders");

  const orders = await getUserOrders(session.user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg mb-4">You haven&apos;t placed any orders yet.</p>
          <Link href="/products" className="text-primary hover:underline">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: typeof orders[number]) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <div className="border rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm text-gray-500">#{order.id.slice(-8)}</p>
                    <p className="font-bold text-lg mt-1">${order.total.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">
                      {order._count.orderItems} item{order._count.orderItems !== 1 ? "s" : ""} &middot;{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge>{order.status}</Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
