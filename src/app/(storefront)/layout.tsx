import { CartProvider } from "@/components/storefront/CartContext";
import { Navbar } from "@/components/storefront/Navbar";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <footer className="border-t py-8 mt-16 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} DropShip Market. All rights reserved.</p>
      </footer>
    </CartProvider>
  );
}
