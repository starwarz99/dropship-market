import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata?.orderId;

    if (!orderId) return NextResponse.json({ ok: true });

    // Mark order as PAID
    const order = await prisma.order.update({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: { status: "PAID" },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                dropShipperProduct: {
                  include: { dropShipper: true },
                },
              },
            },
          },
        },
      },
    });

    // Create payout records and attempt Stripe Connect transfers
    for (const item of order.orderItems) {
      const dropShipper = item.product.dropShipperProduct.dropShipper;
      const payoutAmount = item.wholesalePrice * item.quantity;

      const payout = await prisma.payout.create({
        data: {
          orderItemId: item.id,
          dropShipperId: dropShipper.id,
          amount: payoutAmount,
          status: "PENDING",
        },
      });

      if (dropShipper.stripeAccountId && dropShipper.isActive) {
        try {
          const transfer = await stripe.transfers.create({
            amount: Math.round(payoutAmount * 100),
            currency: "usd",
            destination: dropShipper.stripeAccountId,
            transfer_group: orderId,
          });

          await prisma.payout.update({
            where: { id: payout.id },
            data: {
              stripeTransferId: transfer.id,
              status: "COMPLETED",
            },
          });
        } catch (err) {
          console.error(`Payout failed for dropShipper ${dropShipper.id}:`, err);
          await prisma.payout.update({
            where: { id: payout.id },
            data: { status: "FAILED" },
          });
        }
      }
    }

    // Mark order as PROCESSING after payouts
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "PROCESSING" },
    });
  }

  return NextResponse.json({ ok: true });
}
