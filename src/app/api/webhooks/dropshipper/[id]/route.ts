import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/webhook-verify";
import { calculateSellingPrice, resolveMarkup } from "@/lib/pricing";
import { generateUniqueProductSlug } from "@/lib/slugify";

export const runtime = "nodejs";

interface WebhookPayload {
  event: "product.created" | "product.updated" | "product.deleted";
  product: {
    id: string;
    title: string;
    description?: string;
    wholesalePrice: number;
    imageUrls?: string[];
    inventoryCount?: number;
    [key: string]: unknown;
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: dropShipperId } = await params;
  const body = await req.text();
  const signature = req.headers.get("x-webhook-signature") ?? "";

  // Look up drop-shipper
  const dropShipper = await prisma.dropShipper.findUnique({
    where: { id: dropShipperId },
  });

  if (!dropShipper || !dropShipper.isActive) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Verify HMAC signature
  if (!verifyWebhookSignature(body, signature, dropShipper.webhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event, product } = payload;

  if (event === "product.deleted") {
    await prisma.dropShipperProduct.deleteMany({
      where: { dropShipperId, externalId: product.id },
    });
    return NextResponse.json({ ok: true });
  }

  if (event === "product.created" || event === "product.updated") {
    const { id: externalId, title, description, wholesalePrice, imageUrls = [], inventoryCount = 0, ...rest } = product;

    await prisma.dropShipperProduct.upsert({
      where: {
        dropShipperId_externalId: { dropShipperId, externalId },
      },
      create: {
        dropShipperId,
        externalId,
        title,
        description: description ?? null,
        wholesalePrice,
        imageUrls,
        inventoryCount,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rawData: rest as any,
      },
      update: {
        title,
        description: description ?? null,
        wholesalePrice,
        imageUrls,
        inventoryCount,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rawData: rest as any,
      },
    });

    // If there's a linked Product, update its selling price when wholesale price changes
    const dsp = await prisma.dropShipperProduct.findUnique({
      where: { dropShipperId_externalId: { dropShipperId, externalId } },
      include: {
        product: { include: { category: true } },
        dropShipper: true,
      },
    });

    if (dsp?.product) {
      const markup = resolveMarkup(
        dsp.product.markupOverride,
        dsp.product.category?.defaultMarkup,
        dsp.dropShipper.defaultMarkup
      );
      const sellingPrice = calculateSellingPrice(wholesalePrice, markup);

      await prisma.product.update({
        where: { id: dsp.product.id },
        data: {
          sellingPrice,
          name: title,
          description: description ?? null,
          imageUrls,
        },
      });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown event" }, { status: 400 });
}
