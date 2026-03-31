import { createServerClient } from "@/lib/supabase/server";

/**
 * Validate a photo audit token and return the associated property_id.
 * Returns null if the token is invalid or expired.
 */
export async function validateToken(
  token: string | null | undefined
): Promise<{ property_id: string } | null> {
  if (!token) return null;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("photo_audit_tokens")
    .select("property_id, expires_at")
    .eq("token", token)
    .single();

  if (error || !data) return null;

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }

  return { property_id: data.property_id };
}

/**
 * Extract token from request URL search params.
 */
export function getTokenFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  return url.searchParams.get("token");
}
