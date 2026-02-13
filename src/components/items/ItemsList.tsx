"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useItems } from "@/hooks/useItems";
import { ClientItemCard } from "./ClientItemCard";
import { Pagination } from "./Pagination";
import { formatCurrency } from "@/lib/pricing";
import { useState } from "react";

interface ItemsListProps {
  room?: string;
  title: string;
  subtitle?: string;
}

export function ItemsList({ room, title, subtitle }: ItemsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parseInt(searchParams.get("page") || "1", 10);
  const sort = searchParams.get("sort") || "total_cost.desc";
  const category = searchParams.get("category") || undefined;
  const status = searchParams.get("status") || undefined;

  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );

  const { data, isLoading, error } = useItems({
    room,
    page,
    sort,
    category,
    status,
    search: searchParams.get("search") || undefined,
  });

  function updateParam(key: string, value: string | number) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "" || value === 0) {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput) {
      params.set("search", searchInput);
    } else {
      params.delete("search");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const totalValue = data?.items.reduce(
    (sum, item) => sum + (Number(item.total_cost) || 0),
    0
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        )}
      </div>

      {/* Metrics */}
      {data && (
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-3">
            <p className="text-sm text-slate-500">Items</p>
            <p className="text-xl font-bold text-slate-900">
              {data.total.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-3">
            <p className="text-sm text-slate-500">Page Value</p>
            <p className="text-xl font-bold text-slate-900">
              {formatCurrency(totalValue)}
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search items, brands, or keywords..."
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Search
          </button>
          {searchParams.get("search") && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateParam("search", "");
              }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Top Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mb-4">
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            pageSize={data.pageSize}
            onPageChange={(p) => updateParam("page", p)}
          />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-500">Loading items...</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Error: {(error as Error).message}
        </div>
      )}

      {/* Item Cards */}
      {data && (
        <div className="space-y-4">
          {data.items.map((item) => (
            <ClientItemCard key={`${item.room_slug}-${item.row_id}`} item={item} />
          ))}

          {data.items.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-white px-6 py-10 text-center text-slate-500">
              No items found matching your filters.
            </div>
          )}
        </div>
      )}

      {/* Bottom Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            total={data.total}
            pageSize={data.pageSize}
            onPageChange={(p) => updateParam("page", p)}
          />
        </div>
      )}
    </div>
  );
}
