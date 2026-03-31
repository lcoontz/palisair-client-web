"use client";

import { useQuery } from "@tanstack/react-query";
import type { PhotoAuditRoom } from "@/lib/photo-audit/types";

export function usePhotoAuditRooms(token: string) {
  return useQuery({
    queryKey: ["photo-audit-rooms", token],
    queryFn: async (): Promise<{ rooms: PhotoAuditRoom[] }> => {
      const res = await fetch(
        `/api/photo-audit/rooms?token=${encodeURIComponent(token)}`
      );
      if (!res.ok) throw new Error("Failed to fetch rooms");
      return res.json();
    },
  });
}
