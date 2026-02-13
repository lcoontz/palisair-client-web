"use client";

import { useQuery } from "@tanstack/react-query";
import { ItemsResponse } from "@/types";

interface UseItemsParams {
  room?: string;
  page?: number;
  sort?: string;
  category?: string;
  status?: string;
  search?: string;
}

export function useItems(params: UseItemsParams) {
  const { room, page = 1, sort = "total_cost.desc", category, status, search } = params;

  return useQuery<ItemsResponse>({
    queryKey: ["items", room, page, sort, category, status, search],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (room) searchParams.set("room", room);
      searchParams.set("page", String(page));
      searchParams.set("sort", sort);
      if (category && category !== "All Categories")
        searchParams.set("category", category);
      if (status && status !== "All Statuses")
        searchParams.set("status", status);
      if (search) searchParams.set("search", search);

      const res = await fetch(`/api/items?${searchParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json();
    },
  });
}
