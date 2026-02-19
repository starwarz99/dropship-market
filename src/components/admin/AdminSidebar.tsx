"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tag,
  Truck,
  ShoppingBag,
  CreditCard,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/catalog", label: "Catalog", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/dropshippers", label: "Drop-Shippers", icon: Truck },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/payouts", label: "Payouts", icon: CreditCard },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-gray-50 min-h-screen">
      <div className="p-6 border-b">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Store className="h-5 w-5" />
          DropShip Admin
        </Link>
      </div>
      <nav className="p-4 space-y-1">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
