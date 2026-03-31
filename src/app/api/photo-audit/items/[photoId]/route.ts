import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { validateToken, getTokenFromRequest } from "@/lib/photo-audit/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { photoId: string } }
) {
  const auth = await validateToken(getTokenFromRequest(request));
  if (!auth) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("photo_items")
    .select("*")
    .eq("photo_audit_id", params.photoId)
    .order("item_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
