import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || null;
  const status = searchParams.get("status") || null;

  // Use RPC function to aggregate all items (no 1000 row limit)
  const { data: roomStats, error } = await supabase.rpc("get_overview_stats", {
    p_category: category,
    p_status: status,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rooms = (roomStats || []).map((r: { room_slug: string; display_name: string; item_count: number; priced_count: number; total_value: number }) => ({
    slug: r.room_slug,
    display_name: r.display_name,
    item_count: Number(r.item_count),
    priced_count: Number(r.priced_count),
    total_value: Number(r.total_value),
  }));

  const totalItems = rooms.reduce((sum: number, r: { item_count: number }) => sum + r.item_count, 0);
  const totalValue = rooms.reduce((sum: number, r: { total_value: number }) => sum + r.total_value, 0);
  const pricedCount = rooms.reduce((sum: number, r: { priced_count: number }) => sum + r.priced_count, 0);

  return NextResponse.json({
    total_items: totalItems,
    total_value: totalValue,
    priced_count: pricedCount,
    rooms,
  });
}
