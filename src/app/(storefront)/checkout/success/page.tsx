import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <div className="flex justify-center mb-6">
        <CheckCircle className="h-16 w-16 text-green-500" />
      </div>
      <h1 className="text-3xl font-bold mb-4">Order Placed!</h1>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Thank you for your purchase. You&apos;ll receive a confirmation shortly.
        You can track your order status in your account.
      </p>
      <div className="flex gap-4 justify-center">
        <Button asChild>
          <Link href="/orders">View My Orders</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
