"use client";

import { useQuery } from "@tanstack/react-query";
import { Room } from "@/types";

export function useRooms() {
  return useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: async () => {
      const res = await fetch("/api/rooms");
      if (!res.ok) throw new Error("Failed to fetch rooms");
      return res.json();
    },
  });
}
