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
import { createCategory } from "./actions";
import { Plus } from "lucide-react";

export function CategoryForm() {
  const [open, setOpen] = useState(false);

  async function handleAction(formData: FormData) {
    await createCategory(formData);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
        </DialogHeader>
        <form action={handleAction} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="Electronics" />
          </div>
          <div>
            <Label htmlFor="defaultMarkup">Default Markup (%)</Label>
            <Input
              id="defaultMarkup"
              name="defaultMarkup"
              type="number"
              min="0"
              max="500"
              defaultValue="20"
              required
            />
          </div>
          <div>
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input id="imageUrl" name="imageUrl" placeholder="https://..." />
          </div>
          <Button type="submit" className="w-full">Create Category</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
