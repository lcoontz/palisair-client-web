import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { validateToken, getTokenFromRequest } from "@/lib/photo-audit/auth";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 60;

export async function GET(request: Request) {
  const auth = await validateToken(getTokenFromRequest(request));
  if (!auth) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const url = new URL(request.url);
  const room = url.searchParams.get("room");
  const sort = url.searchParams.get("sort") ?? "filename";
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(
    url.searchParams.get("pageSize") ?? String(PAGE_SIZE),
    10
  );

  if (!room) {
    return NextResponse.json(
      { error: "room parameter required" },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const offset = (page - 1) * pageSize;

  // Build query — overview always first, then sort by category or filename
  let query = supabase
    .from("photo_audit")
    .select("*", { count: "exact" })
    .eq("property_id", auth.property_id)
    .eq("room_folder", room)
    .order("is_overview", { ascending: false });

  if (sort === "category") {
    query = query
      .order("primary_category", { ascending: true, nullsFirst: false })
      .order("photo_timestamp", { ascending: true, nullsFirst: false })
      .order("sequence_number", { ascending: true, nullsFirst: false });
  } else {
    // sort by filename (chronological)
    query = query
      .order("photo_timestamp", { ascending: true, nullsFirst: false })
      .order("sequence_number", { ascending: true, nullsFirst: false })
      .order("filename", { ascending: true });
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    photos: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  });
}
