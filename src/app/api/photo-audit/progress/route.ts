import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { validateToken, getTokenFromRequest } from "@/lib/photo-audit/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await validateToken(getTokenFromRequest(request));
  if (!auth) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const supabase = createServerClient();

  // Reuse the rooms RPC to derive progress without hitting row limits
  const { data, error } = await supabase.rpc("get_photo_audit_rooms", {
    p_property_id: auth.property_id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rooms = data ?? [];
  let total = 0, reviewed = 0, approved = 0, flagged = 0, roomsComplete = 0;

  for (const room of rooms) {
    total += Number(room.total_photos);
    reviewed += Number(room.reviewed_count);
    approved += Number(room.approved_count);
    flagged += Number(room.flagged_count);
    if (Number(room.reviewed_count) === Number(room.total_photos) && Number(room.total_photos) > 0) {
      roomsComplete++;
    }
  }

  return NextResponse.json({
    total_photos: total,
    reviewed,
    approved,
    flagged,
    pending: total - reviewed,
    rooms_complete: roomsComplete,
    rooms_total: rooms.length,
  });
}
