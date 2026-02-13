"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Item, ClientItemUpdatePayload } from "@/types";

export function useItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      rowId,
      roomSlug,
      payload,
    }: {
      rowId: string;
      roomSlug: string;
      payload: ClientItemUpdatePayload;
    }) => {
      const res = await fetch(`/api/items/${encodeURIComponent(rowId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, room_slug: roomSlug }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Save failed" }));
        throw new Error(err.error || "Save failed");
      }
      return res.json() as Promise<Item>;
    },

    // Optimistic update: immediately reflect changes in the cache
    onMutate: async ({ rowId, roomSlug, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["items"] });

      const previousQueries = queryClient.getQueriesData({ queryKey: ["items"] });

      queryClient.setQueriesData(
        { queryKey: ["items"] },
        (old: unknown) => {
          if (!old || typeof old !== "object") return old;
          const data = old as { items: Item[]; total: number; page: number; pageSize: number; totalPages: number };
          if (!data.items) return old;
          return {
            ...data,
            items: data.items.map((item: Item) => {
              if (item.row_id === rowId && item.room_slug === roomSlug) {
                return { ...item, ...payload, sync_status: "pending_push" as const };
              }
              return item;
            }),
          };
        }
      );

      return { previousQueries };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
    },
  });
}
