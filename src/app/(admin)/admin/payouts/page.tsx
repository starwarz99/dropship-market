import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { retryPayout } from "./actions";

async function getPayouts() {
  return prisma.payout.findMany({
    include: {
      orderItem: {
        include: {
          order: { select: { id: true, createdAt: true } },
          product: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

async function getDropShippers() {
  return prisma.dropShipper.findMany({ select: { id: true, name: true } });
}

export default async function AdminPayoutsPage() {
  const [payouts, dropShippers] = await Promise.all([getPayouts(), getDropShippers()]);
  const dsMap = Object.fromEntries(dropShippers.map((ds) => [ds.id, ds.name]));

  const totalPending = payouts
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCompleted = payouts
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Payouts</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border rounded-xl p-4">
          <p className="text-sm text-gray-500">Total Pending</p>
          <p className="text-2xl font-bold text-orange-600">${totalPending.toFixed(2)}</p>
        </div>
        <div className="border rounded-xl p-4">
          <p className="text-sm text-gray-500">Total Completed</p>
          <p className="text-2xl font-bold text-green-600">${totalCompleted.toFixed(2)}</p>
        </div>
        <div className="border rounded-xl p-4">
          <p className="text-sm text-gray-500">Total Payouts</p>
          <p className="text-2xl font-bold">{payouts.length}</p>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-medium text-gray-600">Drop-Shipper</th>
              <th className="text-left p-4 font-medium text-gray-600">Product</th>
              <th className="text-left p-4 font-medium text-gray-600">Order</th>
              <th className="text-left p-4 font-medium text-gray-600">Amount</th>
              <th className="text-left p-4 font-medium text-gray-600">Stripe Transfer</th>
              <th className="text-left p-4 font-medium text-gray-600">Status</th>
              <th className="text-right p-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {payouts.map((payout) => (
              <tr key={payout.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{dsMap[payout.dropShipperId] ?? payout.dropShipperId.slice(-8)}</td>
                <td className="p-4 text-gray-600">{payout.orderItem.product.name}</td>
                <td className="p-4">
                  <span className="font-mono text-xs text-primary">
                    {payout.orderItem.order.id.slice(-8)}
                  </span>
                </td>
                <td className="p-4 font-medium">${payout.amount.toFixed(2)}</td>
                <td className="p-4 text-xs text-gray-500 font-mono">
                  {payout.stripeTransferId ?? "—"}
                </td>
                <td className="p-4">
                  <Badge
                    variant={
                      payout.status === "COMPLETED"
                        ? "default"
                        : payout.status === "FAILED"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {payout.status}
                  </Badge>
                </td>
                <td className="p-4 text-right">
                  {payout.status === "FAILED" && (
                    <form action={retryPayout} className="inline">
                      <input type="hidden" name="payoutId" value={payout.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Retry
                      </Button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {payouts.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No payouts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
