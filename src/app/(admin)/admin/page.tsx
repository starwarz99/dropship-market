import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingBag, Truck, CreditCard } from "lucide-react";

async function getStats() {
  const [productCount, orderCount, dropShipperCount, pendingPayouts] = await Promise.all([
    prisma.product.count({ where: { isVisible: true } }),
    prisma.order.count(),
    prisma.dropShipper.count({ where: { isActive: true } }),
    prisma.payout.count({ where: { status: "PENDING" } }),
  ]);

  const revenue = await prisma.order.aggregate({
    where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
    _sum: { total: true },
  });

  return { productCount, orderCount, dropShipperCount, pendingPayouts, revenue: revenue._sum.total ?? 0 };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    { title: "Live Products", value: stats.productCount, icon: Package, color: "text-blue-600" },
    { title: "Total Orders", value: stats.orderCount, icon: ShoppingBag, color: "text-green-600" },
    { title: "Active Drop-Shippers", value: stats.dropShipperCount, icon: Truck, color: "text-purple-600" },
    { title: "Pending Payouts", value: stats.pendingPayouts, icon: CreditCard, color: "text-orange-600" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map(({ title, value, icon: Icon, color }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
              <Icon className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-green-600">${stats.revenue.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">From paid and processing orders</p>
        </CardContent>
      </Card>
    </div>
  );
}
