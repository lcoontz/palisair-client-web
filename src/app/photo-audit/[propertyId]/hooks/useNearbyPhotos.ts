"use client";

import { useQuery } from "@tanstack/react-query";
import type { PhotoAudit } from "@/lib/photo-audit/types";

export function useNearbyPhotos(token: string, photoId: string | null) {
  return useQuery({
    queryKey: ["photo-audit-nearby", token, photoId],
    queryFn: async (): Promise<{ nearby: PhotoAudit[] }> => {
      const res = await fetch(
        `/api/photo-audit/photos/nearby?token=${encodeURIComponent(token)}&photoId=${photoId}`
      );
      if (!res.ok) throw new Error("Failed to fetch nearby photos");
      return res.json();
    },
    enabled: !!photoId,
  });
}
