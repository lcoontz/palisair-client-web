import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { validateToken, getTokenFromRequest } from "@/lib/photo-audit/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await validateToken(getTokenFromRequest(request));
  if (!auth) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const url = new URL(request.url);
  const photoId = url.searchParams.get("photoId");

  if (!photoId) {
    return NextResponse.json(
      { error: "photoId parameter required" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Fetch the target photo
  const { data: target, error: targetError } = await supabase
    .from("photo_audit")
    .select("*")
    .eq("id", photoId)
    .single();

  if (targetError || !target) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  let nearby: typeof target[] = [];

  if (target.photo_timestamp) {
    // Timestamp-based: find photos within ±5 minutes in the same room
    const targetTime = new Date(target.photo_timestamp).getTime();
    const fiveMinMs = 5 * 60 * 1000;
    const minTime = new Date(targetTime - fiveMinMs).toISOString();
    const maxTime = new Date(targetTime + fiveMinMs).toISOString();

    const { data } = await supabase
      .from("photo_audit")
      .select("*")
      .eq("property_id", auth.property_id)
      .eq("room_folder", target.room_folder)
      .neq("id", photoId)
      .gte("photo_timestamp", minTime)
      .lte("photo_timestamp", maxTime)
      .order("photo_timestamp", { ascending: true })
      .limit(20);

    nearby = data ?? [];
  } else if (target.sequence_number) {
    // DSC sequence-based: find photos within ±5 sequence numbers
    const { data } = await supabase
      .from("photo_audit")
      .select("*")
      .eq("property_id", auth.property_id)
      .eq("room_folder", target.room_folder)
      .neq("id", photoId)
      .gte("sequence_number", target.sequence_number - 5)
      .lte("sequence_number", target.sequence_number + 5)
      .order("sequence_number", { ascending: true })
      .limit(20);

    nearby = data ?? [];
  }

  return NextResponse.json({ nearby });
}
