import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import CartSync from "@/components/CartSync";
import Toaster from "@/components/Toaster";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Radharani Collection — Curated Fashion",
  description:
    "Shop the latest in men's, women's, kids' and accessories at Radharani Collection.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    isAdmin = !!profile?.is_admin;
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("slug, name")
    .order("sort_order");

  const cats = categories ?? [];

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white text-gray-900 antialiased">
        <Header
          categories={cats}
          user={user ? { email: user.email!, isAdmin } : null}
        />
        <main className="flex-1">{children}</main>
        <Footer categories={cats} />
        <CartDrawer />
        <CartSync />
        <Toaster />
      </body>
    </html>
  );
}
