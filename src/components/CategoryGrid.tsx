import Link from "next/link";
import type { Category } from "@/types/db";

export default function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h2 className="text-2xl md:text-3xl font-display font-bold mb-6">Shop by category</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.slug}`}
            className="group relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center"
          >
            {c.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.image_url}
                alt={c.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )}
            <span className="relative z-10 text-xl md:text-2xl font-display font-bold text-white drop-shadow-md bg-black/30 px-4 py-1.5 rounded">
              {c.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
