import { createClient } from "@/lib/supabase/server";
import CheckoutClient from "@/components/CheckoutClient";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let name = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    name = profile?.full_name ?? "";
  }

  return (
    <CheckoutClient
      initialEmail={user?.email ?? ""}
      initialName={name}
    />
  );
}
