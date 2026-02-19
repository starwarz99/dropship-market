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
import { createDropShipper } from "./actions";
import { Plus } from "lucide-react";

export function DropShipperForm({ defaultSecret }: { defaultSecret: string }) {
  const [open, setOpen] = useState(false);

  async function handleAction(formData: FormData) {
    await createDropShipper(formData);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Drop-Shipper
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Drop-Shipper</DialogTitle>
        </DialogHeader>
        <form action={handleAction} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="Supplier Co." />
          </div>
          <div>
            <Label htmlFor="webhookSecret">Webhook Secret</Label>
            <Input
              id="webhookSecret"
              name="webhookSecret"
              required
              defaultValue={defaultSecret}
              className="font-mono text-xs"
            />
            <p className="text-xs text-gray-500 mt-1">Share this with the drop-shipper to sign their requests.</p>
          </div>
          <div>
            <Label htmlFor="stripeAccountId">Stripe Account ID (optional)</Label>
            <Input
              id="stripeAccountId"
              name="stripeAccountId"
              placeholder="acct_..."
            />
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
          <Button type="submit" className="w-full">Create Drop-Shipper</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
