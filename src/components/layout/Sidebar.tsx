"use client";

import { useRooms } from "@/hooks/useRooms";
import { useQuery } from "@tanstack/react-query";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { SORT_OPTIONS, STATUS_FILTER_OPTIONS, STATUS_CONFIG } from "@/lib/constants";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: rooms } = useRooms();
  const { data: categories } = useQuery<string[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const currentRoom = pathname.startsWith("/room/")
    ? decodeURIComponent(pathname.split("/room/")[1])
    : null;
  const currentSort = searchParams.get("sort") || "total_cost.desc";
  const currentCategory = searchParams.get("category") || "All Categories";
  const currentStatus = searchParams.get("status") || "All Statuses";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (
      value === "All Categories" ||
      value === "All Statuses" ||
      value === ""
    ) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`);
  }

  const navItems = [
    { label: "Overview", href: "/overview" },
    { label: "All Items", href: "/all-items" },
  ];

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-4 py-5">
        <h1 className="text-lg font-bold text-slate-900">Palisair Client</h1>
        <p className="mt-0.5 text-xs text-slate-500">1070 Palisair</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === item.href
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Room List */}
        <div className="mb-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Rooms
          </p>
          <div className="space-y-0.5">
            {rooms?.map((room) => (
              <Link
                key={room.slug}
                href={`/room/${encodeURIComponent(room.slug)}`}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  currentRoom === room.slug
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{room.display_name}</span>
                <span className="ml-2 text-xs text-slate-400">
                  ({room.item_count})
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3 border-t border-slate-200 pt-4">
          <FilterSelect
            label="Category"
            value={currentCategory}
            options={["All Categories", ...(categories || [])]}
            onChange={(v) => updateParam("category", v)}
          />

          <FilterSelect
            label="Status"
            value={currentStatus}
            options={STATUS_FILTER_OPTIONS}
            onChange={(v) => updateParam("status", v)}
            formatOption={(opt) => {
              const cfg = STATUS_CONFIG[opt];
              return cfg ? `${cfg.emoji} ${opt || "Select Status..."}` : opt;
            }}
          />

          <FilterSelect
            label="Sort By"
            value={currentSort}
            options={SORT_OPTIONS.map((s) => s.value)}
            onChange={(v) => updateParam("sort", v)}
            formatOption={(val) => {
              const found = SORT_OPTIONS.find((s) => s.value === val);
              return found ? found.label : val;
            }}
          />
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 px-4 py-3">
        <button
          onClick={() => {
            router.refresh();
          }}
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
        >
          Refresh Data
        </button>
      </div>
    </aside>
  );
}
