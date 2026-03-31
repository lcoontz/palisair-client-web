"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PhotoAudit } from "@/lib/photo-audit/types";

export function usePhotoMutation(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      photoId,
      payload,
    }: {
      photoId: string;
      payload: Partial<PhotoAudit>;
    }) => {
      const res = await fetch(
        `/api/photo-audit/photos/${photoId}?token=${encodeURIComponent(token)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Update failed" }));
        throw new Error(err.error || "Update failed");
      }
      return res.json() as Promise<PhotoAudit>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photo-audit-photos"] });
      queryClient.invalidateQueries({ queryKey: ["photo-audit-rooms"] });
    },
  });
}
