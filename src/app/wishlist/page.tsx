import WishlistGrid from "@/components/WishlistGrid";

export const metadata = { title: "My Wishlist — Radharani Collection" };

export default function WishlistPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl md:text-3xl font-display font-bold mb-6">My Wishlist</h1>
      <WishlistGrid />
    </div>
  );
}
