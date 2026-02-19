"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { useCart } from "./CartContext";
import { toast } from "sonner";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string;
  isFeatured?: boolean;
  categoryName?: string;
}

export function ProductCard({
  id,
  name,
  slug,
  price,
  imageUrl,
  isFeatured,
  categoryName,
}: ProductCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ productId: id, name, slug, imageUrl, price });
    toast.success(`${name} added to cart`);
  };

  return (
    <Link href={`/products/${slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={imageUrl || "/placeholder.png"}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
          {isFeatured && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 hover:bg-yellow-600">
              Featured
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          {categoryName && (
            <p className="text-xs text-gray-500 mb-1">{categoryName}</p>
          )}
          <h3 className="font-medium text-sm line-clamp-2 mb-2">{name}</h3>
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg">${price.toFixed(2)}</span>
            <Button size="sm" variant="outline" onClick={handleAddToCart}>
              <ShoppingCart className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
