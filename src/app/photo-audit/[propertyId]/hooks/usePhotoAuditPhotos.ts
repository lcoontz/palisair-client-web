"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { PhotosResponse } from "@/lib/photo-audit/types";

const PAGE_SIZE = 60;

export function usePhotoAuditPhotos(
  token: string,
  room: string | null,
  sort: "category" | "filename"
) {
  return useInfiniteQuery({
    queryKey: ["photo-audit-photos", token, room, sort],
    queryFn: async ({ pageParam = 1 }): Promise<PhotosResponse> => {
      const params = new URLSearchParams({
        token,
        room: room!,
        sort,
        page: String(pageParam),
        pageSize: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/photo-audit/photos?${params}`);
      if (!res.ok) throw new Error("Failed to fetch photos");
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!room,
  });
}
