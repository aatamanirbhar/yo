import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { confirmed: false, error: "missing userId" },
      { status: 400 },
    );
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !data?.user) {
      return NextResponse.json({ confirmed: false });
    }
    return NextResponse.json({
      confirmed: !!data.user.email_confirmed_at,
    });
  } catch {
    return NextResponse.json({ confirmed: false });
  }
}
