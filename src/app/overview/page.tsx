"use client";

import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { OverviewStats, ItemsResponse } from "@/types";
import { PageShell } from "@/components/layout/PageShell";
import { StatsCards } from "@/components/overview/StatsCards";
import { RoomTable } from "@/components/overview/RoomTable";

function OverviewContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const status = searchParams.get("status");

  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (status) params.set("status", status);

  const { data, isLoading, error } = useQuery<OverviewStats>({
    queryKey: ["overview", category, status],
    queryFn: async () => {
      const res = await fetch(`/api/overview?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch overview");
      return res.json();
    },
  });

  // Fetch count of items pending client review
  const { data: reviewData } = useQuery<ItemsResponse>({
    queryKey: ["clientReviewCount"],
    queryFn: async () => {
      const res = await fetch("/api/items?status=client+review&page=1");
      if (!res.ok) return { items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
      return res.json();
    },
  });

  return (
    <PageShell title="Project Overview" subtitle="1070 Palisair — Client Review">
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400">Loading overview...</div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Error loading overview: {(error as Error).message}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <StatsCards
            totalItems={data.total_items}
            totalValue={data.total_value}
            pricedCount={data.priced_count}
            clientReviewCount={reviewData?.total}
          />
          <RoomTable rooms={data.rooms} />
        </div>
      )}
    </PageShell>
  );
}

export default function OverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400">Loading...</div>
        </div>
      }
    >
      <OverviewContent />
    </Suspense>
  );
}
