import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { items }: { items: CartItem[] } = await req.json();

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // Validate items against DB and lock prices
  const productIds = items.map((i) => i.productId);
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, isVisible: true },
    include: {
      dropShipperProduct: {
        include: { dropShipper: true },
      },
    },
  });

  if (dbProducts.length !== items.length) {
    return NextResponse.json(
      { error: "Some products are unavailable" },
      { status: 400 }
    );
  }

  // Build order items with server-side prices (ignore client-side price)
  const orderItemsData = items.map((item) => {
    const dbProduct = dbProducts.find((p) => p.id === item.productId)!;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: dbProduct.sellingPrice,
      wholesalePrice: dbProduct.dropShipperProduct.wholesalePrice,
    };
  });

  const subtotal = orderItemsData.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  // Create a placeholder order (PENDING) with a dummy shipping address
  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      status: "PENDING",
      subtotal,
      total: subtotal,
      shippingAddress: {},
      orderItems: {
        create: orderItemsData.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          wholesalePrice: item.wholesalePrice,
        })),
      },
    },
  });

  // Create Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(subtotal * 100),
    currency: "usd",
    metadata: { orderId: order.id, userId: session.user.id },
    automatic_payment_methods: { enabled: true },
  });

  // Attach payment intent to order
  await prisma.order.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    orderId: order.id,
  });
}
