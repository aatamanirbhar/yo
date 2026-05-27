import Link from "next/link";

export default function Footer({
  categories,
}: {
  categories: { slug: string; name: string }[];
}) {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <h3 className="font-display text-lg font-bold text-white mb-2">Radharani Collection</h3>
          <p className="text-sm text-gray-400">
            Curated fashion for men, women, kids & accessories. Shipped across India.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Shop</h4>
          <ul className="space-y-1.5 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="hover:text-white">{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-3">Account</h4>
          <ul className="space-y-1.5 text-sm">
            <li><Link href="/auth/login" className="hover:text-white">Sign in</Link></li>
            <li><Link href="/auth/signup" className="hover:text-white">Create account</Link></li>
            <li><Link href="/account/orders" className="hover:text-white">Order history</Link></li>
            <li><Link href="/track" className="hover:text-white">Track order</Link></li>
            <li><Link href="/wishlist" className="hover:text-white">Wishlist</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} Radharani Collection. All rights reserved.
      </div>
    </footer>
  );
}
