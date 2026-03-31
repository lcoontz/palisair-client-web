import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { validateToken, getTokenFromRequest } from "@/lib/photo-audit/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await validateToken(getTokenFromRequest(request));
  if (!auth) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const body = await request.json();
  const { photo_ids, action, target_room, target_room_display_name, flag_reason } =
    body as {
      photo_ids: string[];
      action: "flag" | "approve" | "move" | "link" | "unlink" | "set_overview" | "remove_overview";
      target_room?: string;
      target_room_display_name?: string;
      flag_reason?: string;
    };

  if (!photo_ids?.length || !action) {
    return NextResponse.json(
      { error: "photo_ids and action required" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const now = new Date().toISOString();

  if (action === "approve") {
    const { error } = await supabase
      .from("photo_audit")
      .update({
        status: "approved",
        reviewed_by: "client",
        reviewed_at: now,
      })
      .in("id", photo_ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else if (action === "flag") {
    const { error } = await supabase
      .from("photo_audit")
      .update({
        status: "flagged",
        flag_reason: flag_reason ?? "low_quality",
        reviewed_by: "client",
        reviewed_at: now,
      })
      .in("id", photo_ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else if (action === "move") {
    if (!target_room) {
      return NextResponse.json(
        { error: "target_room required for move" },
        { status: 400 }
      );
    }

    // Fetch current rooms for moved_from_room tracking
    const { data: photos } = await supabase
      .from("photo_audit")
      .select("id, room_folder")
      .in("id", photo_ids);

    // Update each photo individually to preserve moved_from_room
    for (const photo of photos ?? []) {
      if (photo.room_folder === target_room) continue;
      await supabase
        .from("photo_audit")
        .update({
          room_folder: target_room,
          room_display_name:
            target_room_display_name ??
            target_room.replace("Palisair Photos/", "").replace(/\/$/, ""),
          moved_from_room: photo.room_folder,
          reviewed_by: "client",
          reviewed_at: now,
        })
        .eq("id", photo.id);
    }
  } else if (action === "link") {
    if (photo_ids.length < 2) {
      return NextResponse.json(
        { error: "At least 2 photos required to link" },
        { status: 400 }
      );
    }

    // Check if any selected photos already belong to a link group
    const { data: existing } = await supabase
      .from("photo_audit")
      .select("id, link_group_id")
      .in("id", photo_ids)
      .not("link_group_id", "is", null);

    // Reuse existing group ID if any photo is already linked, otherwise generate new
    const groupId =
      existing && existing.length > 0
        ? existing[0].link_group_id
        : crypto.randomUUID();

    const { error } = await supabase
      .from("photo_audit")
      .update({ link_group_id: groupId })
      .in("id", photo_ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else if (action === "unlink") {
    const { error } = await supabase
      .from("photo_audit")
      .update({ link_group_id: null })
      .in("id", photo_ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else if (action === "set_overview") {
    const { error } = await supabase
      .from("photo_audit")
      .update({ is_overview: true })
      .in("id", photo_ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else if (action === "remove_overview") {
    const { error } = await supabase
      .from("photo_audit")
      .update({ is_overview: false })
      .in("id", photo_ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, count: photo_ids.length });
}
