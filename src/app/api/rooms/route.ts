import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerClient();

    // Use client-specific RPC to get room stats filtered to 'final' and 'client review' items
    const { data: roomStats, error } = await supabase.rpc("get_client_overview_stats", {
      p_category: null,
      p_status: null,
    });

    if (error) {
      console.error("Rooms API error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rooms = (roomStats || []).map((r: { room_slug: string; display_name: string; item_count: number; priced_count: number; total_value: number }) => ({
      slug: r.room_slug,
      display_name: r.display_name,
      item_count: Number(r.item_count),
      total_value: Number(r.total_value),
      priced_count: Number(r.priced_count),
      last_synced_at: null,
    }));

    console.log("Rooms API returning", rooms.length, "rooms (client-filtered)");
    return NextResponse.json(rooms);
  } catch (e) {
    console.error("Rooms API exception:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
