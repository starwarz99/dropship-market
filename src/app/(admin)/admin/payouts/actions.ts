"use server";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { revalidatePath } from "next/cache";

export async function retryPayout(formData: FormData) {
  const payoutId = formData.get("payoutId") as string;

  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    include: {
      orderItem: { include: { order: true } },
    },
  });

  if (!payout || payout.status !== "FAILED") return;

  const dropShipper = await prisma.dropShipper.findUnique({
    where: { id: payout.dropShipperId },
  });

  if (!dropShipper?.stripeAccountId) {
    // No Stripe account — mark as pending for manual payout
    await prisma.payout.update({
      where: { id: payoutId },
      data: { status: "PENDING" },
    });
    revalidatePath("/admin/payouts");
    return;
  }

  try {
    const transfer = await stripe.transfers.create({
      amount: Math.round(payout.amount * 100),
      currency: "usd",
      destination: dropShipper.stripeAccountId,
      transfer_group: payout.orderItem.orderId,
    });

    await prisma.payout.update({
      where: { id: payoutId },
      data: { stripeTransferId: transfer.id, status: "COMPLETED" },
    });
  } catch (err) {
    console.error("Retry payout failed:", err);
  }

  revalidatePath("/admin/payouts");
}
