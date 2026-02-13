import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { rowId: string } }
) {
  const supabase = createServerClient();
  const { rowId } = params;
  const body = await request.json();
  const { room_slug, review_action, client_feedback, target_price } = body;

  if (!room_slug) {
    return NextResponse.json({ error: "room_slug is required" }, { status: 400 });
  }

  // Fetch current item
  const { data: existing, error: fetchError } = await supabase
    .from("items")
    .select("*")
    .eq("row_id", rowId)
    .eq("room_slug", room_slug)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const update: Record<string, unknown> = {};

  // Only allow review_action change: "client review" -> "final"
  if (review_action !== undefined) {
    if (review_action === "final" && existing.review_action === "client review") {
      update.review_action = "final";
    } else if (review_action !== existing.review_action) {
      return NextResponse.json(
        { error: "Client can only approve 'client review' items to 'final'" },
        { status: 403 }
      );
    }
  }

  // Allow client_feedback updates
  if (client_feedback !== undefined) {
    update.client_feedback = client_feedback;
  }

  // Allow target_price updates
  if (target_price !== undefined) {
    update.target_price = target_price;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(existing);
  }

  // Perform update (trigger will set sync_status to pending_push)
  const { data, error } = await supabase
    .from("items")
    .update(update)
    .eq("row_id", rowId)
    .eq("room_slug", room_slug)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
