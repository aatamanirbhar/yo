import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-display font-bold mb-6">My Account</h1>

      <div className="card p-5 mb-6">
        <h2 className="font-semibold mb-2">Profile</h2>
        <p className="text-sm text-gray-600 mb-1"><strong>Email:</strong> {user!.email}</p>
        <p className="text-sm text-gray-600 mb-1"><strong>Name:</strong> {profile?.full_name || "—"}</p>
        <p className="text-sm text-gray-600"><strong>Phone:</strong> {profile?.phone || "—"}</p>
      </div>

      <div className="card p-5 mb-6">
        <h2 className="font-semibold mb-2">Orders</h2>
        <Link href="/account/orders" className="text-brand-600 hover:underline text-sm">
          View order history →
        </Link>
      </div>

      <SignOutButton />
    </div>
  );
}
