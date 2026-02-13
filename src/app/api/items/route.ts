import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);

  const room = searchParams.get("room");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const sort = searchParams.get("sort") || "total_cost.desc";
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const offset = (page - 1) * PAGE_SIZE;

  // Parse sort parameter
  const [sortField, sortDir] = sort.split(".");
  const ascending = sortDir === "asc";

  // Build query
  let query = supabase
    .from("items")
    .select("*", { count: "exact" });

  // Filters
  if (room) {
    query = query.eq("room_slug", room);
  }
  if (category) {
    query = query.eq("category", category);
  }
  if (status) {
    query = query.ilike("review_action", status);
  } else {
    // Client default: only show final and client review items
    query = query.or("review_action.ilike.final,review_action.ilike.client review");
  }
  if (search) {
    query = query.or(
      `item.ilike.%${search}%,brand.ilike.%${search}%,item_description.ilike.%${search}%`
    );
  }

  // Sort and paginate
  query = query
    .order(sortField, { ascending, nullsFirst: false })
    .order("row_id", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = count || 0;
  return NextResponse.json({
    items: data || [],
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
}
