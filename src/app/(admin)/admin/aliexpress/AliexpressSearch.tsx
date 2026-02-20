"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { importAliExpressProduct } from "./actions";
import type { AliProduct } from "@/lib/aliexpress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Star, ChevronLeft, ChevronRight, Check } from "lucide-react";

interface SearchResult {
  products: AliProduct[];
  total: number;
  importedIds: string[];
}

function ProductSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-8 w-full mt-2" />
      </div>
    </Card>
  );
}

function ProductCard({
  product,
  isImported: initialImported,
}: {
  product: AliProduct;
  isImported: boolean;
}) {
  const [imported, setImported] = useState(initialImported);
  const [pending, startTransition] = useTransition();

  function handleImport() {
    startTransition(async () => {
      await importAliExpressProduct(product);
      setImported(true);
    });
  }

  const hasDiscount =
    product.originalPrice > 0 && product.originalPrice > product.salePrice;

  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-gray-100 flex-shrink-0">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-contain p-2"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            No image
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1 gap-2">
        <p className="text-sm leading-tight line-clamp-2 font-medium">
          {product.title}
        </p>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span>{product.rating.toFixed(1)}</span>
          {product.category && (
            <Badge variant="secondary" className="text-xs ml-auto truncate max-w-[80px]">
              {product.category}
            </Badge>
          )}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-semibold text-base">
            ${product.salePrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant={imported ? "outline" : "default"}
          className="mt-auto w-full"
          onClick={handleImport}
          disabled={imported || pending}
        >
          {imported ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Imported
            </>
          ) : pending ? (
            "Importing…"
          ) : (
            "Import"
          )}
        </Button>
      </div>
    </Card>
  );
}

export function AliexpressSearch() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchResults(searchQuery: string, searchPage: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/aliexpress/search?q=${encodeURIComponent(searchQuery)}&page=${searchPage}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Search failed");
      }
      setResult(data as SearchResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setPage(1);
    setSubmittedQuery(query);
    fetchResults(query, 1);
  }

  function goToPage(newPage: number) {
    setPage(newPage);
    fetchResults(submittedQuery, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const totalPages = result ? Math.ceil(result.total / 20) : 0;

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="flex gap-2 max-w-xl">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search AliExpress (e.g. wireless earbuds)"
          className="flex-1"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? "Searching…" : "Search"}
        </Button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && result && (
        <>
          <p className="text-sm text-muted-foreground">
            {result.total.toLocaleString()} results for &ldquo;{submittedQuery}&rdquo;
            {totalPages > 1 && ` — page ${page} of ${totalPages}`}
          </p>

          {result.products.length === 0 ? (
            <p className="text-sm text-gray-500">No products found.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {result.products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isImported={result.importedIds.includes(p.id)}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
