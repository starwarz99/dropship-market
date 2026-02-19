"use client";

import { useState } from "react";
import {
  useStripe,
  useElements,
  PaymentElement,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCart } from "./CartContext";

interface ShippingAddress {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export function CheckoutForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<ShippingAddress>({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });

  const handleChange = (field: keyof ShippingAddress) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => setAddress((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?orderId=${orderId}`,
        shipping: {
          name: address.name,
          address: {
            line1: address.line1,
            line2: address.line2 || undefined,
            city: address.city,
            state: address.state,
            postal_code: address.postalCode,
            country: address.country,
          },
        },
      },
    });

    if (error) {
      toast.error(error.message ?? "Payment failed");
      setLoading(false);
    } else {
      clearCart();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" required value={address.name} onChange={handleChange("name")} />
          </div>
          <div>
            <Label htmlFor="line1">Address Line 1</Label>
            <Input id="line1" required value={address.line1} onChange={handleChange("line1")} />
          </div>
          <div>
            <Label htmlFor="line2">Address Line 2 (optional)</Label>
            <Input id="line2" value={address.line2} onChange={handleChange("line2")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" required value={address.city} onChange={handleChange("city")} />
            </div>
            <div>
              <Label htmlFor="state">State / Province</Label>
              <Input id="state" required value={address.state} onChange={handleChange("state")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input id="postalCode" required value={address.postalCode} onChange={handleChange("postalCode")} />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" required value={address.country} onChange={handleChange("country")} />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Payment</h3>
        <PaymentElement />
      </div>

      <Button type="submit" disabled={!stripe || loading} className="w-full" size="lg">
        {loading ? "Processing..." : "Place Order"}
      </Button>
    </form>
  );
}
