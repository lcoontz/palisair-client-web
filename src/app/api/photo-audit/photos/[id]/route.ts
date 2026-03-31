import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { validateToken, getTokenFromRequest } from "@/lib/photo-audit/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await validateToken(getTokenFromRequest(request));
  if (!auth) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = createServerClient();

  // Build update payload from allowed fields
  const update: Record<string, unknown> = {};
  if ("status" in body) update.status = body.status;
  if ("flag_reason" in body) update.flag_reason = body.flag_reason;
  if ("comment" in body) update.comment = body.comment;
  if ("is_overview" in body) update.is_overview = body.is_overview;

  // Handle room move
  if ("room_folder" in body) {
    // Fetch current room to store in moved_from_room
    const { data: current } = await supabase
      .from("photo_audit")
      .select("room_folder")
      .eq("id", params.id)
      .single();

    if (current && current.room_folder !== body.room_folder) {
      update.room_folder = body.room_folder;
      update.room_display_name =
        body.room_display_name ??
        body.room_folder.replace("Palisair Photos/", "").replace(/\/$/, "");
      update.moved_from_room = current.room_folder;
    }
  }

  // Mark as reviewed
  if (Object.keys(update).length > 0) {
    update.reviewed_by = body.reviewed_by ?? "client";
    update.reviewed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("photo_audit")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
