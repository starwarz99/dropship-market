import crypto from "crypto";

export interface AliProduct {
  id: string;
  title: string;
  salePrice: number;
  originalPrice: number;
  currency: string;
  imageUrl: string;
  detailUrl: string;
  category: string;
  rating: number;
}

function buildSign(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join("");
  const str = `${secret}${sorted}${secret}`;
  return crypto.createHash("md5").update(str, "utf8").digest("hex").toUpperCase();
}

export async function searchAliProducts(
  keywords: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ products: AliProduct[]; total: number }> {
  const appKey = process.env.ALIEXPRESS_APP_KEY;
  const appSecret = process.env.ALIEXPRESS_APP_SECRET;
  const trackingId = process.env.ALIEXPRESS_TRACKING_ID;

  if (!appKey || !appSecret || !trackingId) {
    throw new Error("AliExpress credentials not configured");
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  const params: Record<string, string> = {
    app_key: appKey,
    method: "aliexpress.affiliate.product.query",
    sign_method: "md5",
    timestamp,
    v: "2.0",
    format: "json",
    keywords,
    page_no: String(page),
    page_size: String(pageSize),
    target_currency: "USD",
    target_language: "EN",
    tracking_id: trackingId,
  };

  const sign = buildSign(params, appSecret);

  const url = new URL("https://api-sg.aliexpress.com/sync");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  url.searchParams.set("sign", sign);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`AliExpress API error: ${res.status}`);
  }

  const json = await res.json();
  const result =
    json?.aliexpress_affiliate_product_query_response?.resp_result?.result;

  if (!result) {
    return { products: [], total: 0 };
  }

  const total: number = result.total_record_count ?? 0;
  const rawProducts: Record<string, unknown>[] = result.products?.product ?? [];

  const products: AliProduct[] = rawProducts.map((p) => {
    let imageUrl = String(p.product_main_image_url ?? "");
    if (imageUrl.startsWith("//")) imageUrl = `https:${imageUrl}`;

    const salePrice = parseFloat(
      String(p.target_sale_price ?? "0").replace(",", "")
    );
    const originalPrice = parseFloat(
      String(p.target_original_price ?? "0").replace(",", "")
    );

    // evaluate_rate is a percentage string like "94.50%" — convert to 0–5 scale
    const evaluateRateStr = String(p.evaluate_rate ?? "0").replace("%", "");
    const rating = (parseFloat(evaluateRateStr) / 100) * 5;

    return {
      id: String(p.product_id ?? ""),
      title: String(p.product_title ?? ""),
      salePrice: isNaN(salePrice) ? 0 : salePrice,
      originalPrice: isNaN(originalPrice) ? 0 : originalPrice,
      currency: String(p.target_sale_price_currency ?? "USD"),
      imageUrl,
      detailUrl: String(p.product_detail_url ?? ""),
      category: String(p.first_level_category_name ?? ""),
      rating: isNaN(rating) ? 0 : rating,
    };
  });

  return { products, total };
}
