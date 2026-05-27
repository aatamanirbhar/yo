"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, User, Menu, X, Search, Heart, Package } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";

type Cat = { slug: string; name: string };

export default function Header({
  categories,
  user,
}: {
  categories: Cat[];
  user: { email: string; isAdmin: boolean } | null;
}) {
  const router = useRouter();
  const open = useCart((s) => s.open);
  const count = useCart((s) => s.count());
  const wishCount = useWishlist((s) => s.items.length);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              className="md:hidden p-2 -ml-2"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link href="/" className="font-display text-lg sm:text-xl font-bold tracking-tight text-brand-700">
              Radharani Collection
            </Link>
          </div>

          <form
            onSubmit={submitSearch}
            className="hidden md:flex flex-1 max-w-md relative"
          >
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search products..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input pl-9"
            />
          </form>

          <nav className="hidden lg:flex gap-5 text-sm font-medium text-gray-700 flex-shrink-0">
            {categories.slice(0, 4).map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`} className="hover:text-brand-600">
                {c.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Link
              href="/wishlist"
              className="relative p-2 hover:text-brand-600"
              aria-label="wishlist"
            >
              <Heart size={20} />
              {wishCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {wishCount}
                </span>
              )}
            </Link>

            <Link
              href="/track"
              className="hidden md:block p-2 hover:text-brand-600"
              aria-label="track order"
              title="Track order"
            >
              <Package size={20} />
            </Link>

            {user ? (
              <div className="hidden md:flex items-center gap-3 text-sm">
                {user.isAdmin && (
                  <Link href="/admin" className="text-brand-700 font-medium hover:underline">
                    Admin
                  </Link>
                )}
                <Link href="/account" className="flex items-center gap-1.5 text-gray-700 hover:text-brand-600 p-2">
                  <User size={18} />
                </Link>
              </div>
            ) : (
              <Link href="/auth/login" className="hidden md:flex items-center gap-1.5 text-gray-700 hover:text-brand-600 p-2">
                <User size={18} />
              </Link>
            )}

            <button
              onClick={open}
              className="relative p-2 hover:text-brand-600"
              aria-label="open cart"
            >
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <form onSubmit={submitSearch} className="md:hidden pb-3 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search products..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input pl-9"
          />
        </form>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 py-3 space-y-1">
            <Link href="/" className="block px-2 py-2 text-sm" onClick={() => setMobileOpen(false)}>Home</Link>
            {categories.map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`} className="block px-2 py-2 text-sm" onClick={() => setMobileOpen(false)}>
                {c.name}
              </Link>
            ))}
            <Link href="/track" className="block px-2 py-2 text-sm" onClick={() => setMobileOpen(false)}>Track order</Link>
            <Link href="/wishlist" className="block px-2 py-2 text-sm" onClick={() => setMobileOpen(false)}>Wishlist</Link>
            {user ? (
              <>
                {user.isAdmin && (
                  <Link href="/admin" className="block px-2 py-2 text-sm text-brand-700 font-medium" onClick={() => setMobileOpen(false)}>
                    Admin
                  </Link>
                )}
                <Link href="/account" className="block px-2 py-2 text-sm" onClick={() => setMobileOpen(false)}>Account</Link>
              </>
            ) : (
              <Link href="/auth/login" className="block px-2 py-2 text-sm" onClick={() => setMobileOpen(false)}>Login</Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
