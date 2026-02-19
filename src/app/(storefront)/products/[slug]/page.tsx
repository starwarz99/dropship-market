"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/storefront/CartContext";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, ShoppingCart } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrls: string[];
  sellingPrice: number;
  isFeatured: boolean;
  category: { name: string } | null;
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem } = useCart();

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-xl mb-4" />
          <div className="h-8 bg-gray-200 rounded w-2/3 mb-4" />
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-lg text-gray-500 mb-4">Product not found.</p>
        <Button asChild>
          <Link href="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      imageUrl: product.imageUrls[0] ?? "",
      price: product.sellingPrice,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/products">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Link>
      </Button>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-4">
            <Image
              src={product.imageUrls[selectedImage] ?? "/placeholder.png"}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          {product.imageUrls.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {product.imageUrls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                    selectedImage === i ? "border-primary" : "border-transparent"
                  }`}
                >
                  <Image src={url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.category && (
            <p className="text-sm text-gray-500 mb-2">{product.category.name}</p>
          )}
          {product.isFeatured && (
            <Badge className="mb-3 bg-yellow-500">Featured</Badge>
          )}
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <p className="text-4xl font-bold text-primary mb-6">
            ${product.sellingPrice.toFixed(2)}
          </p>

          {product.description && (
            <p className="text-gray-600 mb-8 leading-relaxed">{product.description}</p>
          )}

          <Button size="lg" onClick={handleAddToCart} className="w-full md:w-auto">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
