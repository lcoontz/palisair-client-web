"use client";

import { useQuery } from "@tanstack/react-query";
import type { PhotoItem } from "@/lib/photo-audit/types";

export function usePhotoItems(token: string, photoId: string | null) {
  return useQuery({
    queryKey: ["photo-audit-items", token, photoId],
    queryFn: async (): Promise<{ items: PhotoItem[] }> => {
      const res = await fetch(
        `/api/photo-audit/items/${photoId}?token=${encodeURIComponent(token)}`
      );
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json();
    },
    enabled: !!photoId,
  });
}
