"use client";

import Link from "next/link";
import { RoomStats } from "@/types";
import { formatCurrency } from "@/lib/pricing";

interface RoomTableProps {
  rooms: RoomStats[];
}

export function RoomTable({ rooms }: RoomTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Room
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Items
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Priced
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Est. Value
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rooms.map((room) => (
            <tr
              key={room.slug}
              className="transition-colors hover:bg-slate-50"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/room/${encodeURIComponent(room.slug)}`}
                  className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
                >
                  {room.display_name}
                </Link>
              </td>
              <td className="px-4 py-3 text-right text-sm text-slate-700">
                {room.item_count.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-sm text-slate-700">
                {room.priced_count.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">
                {formatCurrency(room.total_value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
