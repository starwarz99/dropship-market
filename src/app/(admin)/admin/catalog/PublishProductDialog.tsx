"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { publishProduct } from "./actions";
import { calculateSellingPrice, resolveMarkup } from "@/lib/pricing";
import { Upload } from "lucide-react";

interface DSP {
  id: string;
  title: string;
  wholesalePrice: number;
}

interface Category {
  id: string;
  name: string;
  defaultMarkup: number;
}

interface Props {
  dsp: DSP;
  categories: Category[];
  defaultMarkup: number;
}

export function PublishProductDialog({ dsp, categories, defaultMarkup }: Props) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<string>("");
  const [markupOverride, setMarkupOverride] = useState<string>("");
  const [isFeatured, setIsFeatured] = useState(false);

  const categoryMarkup = categories.find((c) => c.id === categoryId)?.defaultMarkup;
  const overrideVal = markupOverride ? parseFloat(markupOverride) / 100 : null;
  const effectiveMarkup = resolveMarkup(overrideVal, categoryMarkup, defaultMarkup);
  const previewPrice = calculateSellingPrice(dsp.wholesalePrice, effectiveMarkup);

  async function handleAction(formData: FormData) {
    formData.set("isFeatured", String(isFeatured));
    await publishProduct(formData);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Publish
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish: {dsp.title}</DialogTitle>
        </DialogHeader>

        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Wholesale Price</span>
            <span className="font-medium">${dsp.wholesalePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Effective Markup</span>
            <span className="font-medium">{(effectiveMarkup * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between font-bold text-base">
            <span>Selling Price</span>
            <span className="text-primary">${previewPrice.toFixed(2)}</span>
          </div>
        </div>

        <form action={handleAction} className="space-y-4">
          <input type="hidden" name="dropShipperProductId" value={dsp.id} />

          <div>
            <Label>Category (optional)</Label>
            <Select
              name="categoryId"
              value={categoryId}
              onValueChange={setCategoryId}
            >
              <SelectTrigger>
                <SelectValue placeholder="No category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No category</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name} ({(cat.defaultMarkup * 100).toFixed(0)}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="markupOverride">Markup Override % (optional)</Label>
            <Input
              id="markupOverride"
              name="markupOverride"
              type="number"
              min="0"
              max="500"
              step="0.1"
              placeholder={`Default: ${(effectiveMarkup * 100).toFixed(0)}%`}
              value={markupOverride}
              onChange={(e) => setMarkupOverride(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="isFeatured">Mark as Featured</Label>
          </div>

          <Button type="submit" className="w-full">
            Publish Product at ${previewPrice.toFixed(2)}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
