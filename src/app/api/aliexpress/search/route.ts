import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchAliProducts } from "@/lib/aliexpress";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  if (!q.trim()) {
    return NextResponse.json({ products: [], total: 0, importedIds: [] });
  }

  let products;
  let total;
  try {
    ({ products, total } = await searchAliProducts(q, page));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Determine which results are already imported
  const externalIds = products.map((p) => p.id);
  const existing = await prisma.dropShipperProduct.findMany({
    where: {
      dropShipperId: "aliexpress-builtin",
      externalId: { in: externalIds },
    },
    select: { externalId: true },
  });
  const importedIds = existing.map((e) => e.externalId);

  return NextResponse.json({ products, total, importedIds });
}
