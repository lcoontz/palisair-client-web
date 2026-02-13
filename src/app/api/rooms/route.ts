import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("display_name", { ascending: true });

    if (error) {
      console.error("Rooms API error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Rooms API returning", data?.length, "rooms");
    return NextResponse.json(data);
  } catch (e) {
    console.error("Rooms API exception:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
