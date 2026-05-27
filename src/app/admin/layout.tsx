import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LayoutDashboard, Package, Tag, ShoppingBag, Users, Ticket } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/admin");
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, full_name")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) redirect("/");

  const nav = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/categories", label: "Categories", icon: Tag },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/coupons", label: "Coupons", icon: Ticket },
    { href: "/admin/users", label: "Users", icon: Users },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid lg:grid-cols-[220px_1fr] gap-6">
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="mb-4">
            <p className="text-xs text-gray-500">Signed in as</p>
            <p className="font-semibold text-sm">{profile.full_name || user.email}</p>
          </div>
          <nav className="space-y-0.5 mb-6">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-brand-50 hover:text-brand-700"
              >
                <n.icon size={16} /> {n.label}
              </Link>
            ))}
          </nav>
          <SignOutButton />
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
