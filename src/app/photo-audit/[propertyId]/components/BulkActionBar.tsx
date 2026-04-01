"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PhotoAudit, PhotoAuditRoom } from "@/lib/photo-audit/types";

export function BulkActionBar({
  selectedCount,
  selectedIds,
  selectedPhotos,
  rooms,
  token,
  onClear,
}: {
  selectedCount: number;
  selectedIds: Set<string>;
  selectedPhotos: PhotoAudit[];
  rooms: PhotoAuditRoom[];
  token: string;
  onClear: () => void;
}) {
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);
  const [showFlagDropdown, setShowFlagDropdown] = useState(false);
  const queryClient = useQueryClient();

  const bulkMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch(
        `/api/photo-audit/photos/bulk?token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photo_ids: Array.from(selectedIds),
            ...body,
          }),
        }
      );
      if (!res.ok) throw new Error("Bulk action failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photo-audit-photos"] });
      queryClient.invalidateQueries({ queryKey: ["photo-audit-rooms"] });
      onClear();
      setShowMoveDropdown(false);
      setShowFlagDropdown(false);
    },
  });

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-slate-900 text-white rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3">
      <span className="text-sm font-medium">
        {selectedCount} selected
      </span>

      <div className="w-px h-5 bg-slate-700" />

      <button
        onClick={() =>
          bulkMutation.mutate({ action: "approve" })
        }
        disabled={bulkMutation.isPending}
        className="px-3 py-1 text-sm bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-50"
      >
        Approve
      </button>

      <div className="relative">
        <button
          onClick={() => setShowFlagDropdown(!showFlagDropdown)}
          disabled={bulkMutation.isPending}
          className="px-3 py-1 text-sm bg-red-600 hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50"
        >
          Flag
        </button>

        {showFlagDropdown && (
          <div className="absolute bottom-full left-0 mb-2 bg-white text-slate-900 rounded-lg shadow-xl border border-slate-200 w-52 overflow-hidden">
            {[
              { value: "low_quality", label: "Low quality" },
              { value: "duplicate_photo", label: "Duplicate photo" },
              { value: "missing_detail", label: "Missing photo detail" },
              { value: "missing_detections", label: "Missing detections" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  bulkMutation.mutate({
                    action: "flag",
                    flag_reason: opt.value,
                  })
                }
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => bulkMutation.mutate({ action: "link" })}
        disabled={bulkMutation.isPending || selectedCount < 2}
        className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
      >
        Link
      </button>

      {(() => {
        const allOverview = selectedPhotos.length > 0 && selectedPhotos.every(p => p.is_overview);
        const noneOverview = selectedPhotos.length > 0 && selectedPhotos.every(p => !p.is_overview);
        // Mixed selection: default to "Set Overview" since that's the additive action
        const action = allOverview ? "remove_overview" : "set_overview";
        const label = allOverview ? "Remove Overview" : "Set Overview";
        return (
          <button
            onClick={() => bulkMutation.mutate({ action })}
            disabled={bulkMutation.isPending}
            className={`px-3 py-1 text-sm rounded-lg transition-colors disabled:opacity-50 ${
              allOverview
                ? "bg-slate-600 hover:bg-slate-500"
                : "bg-indigo-600 hover:bg-indigo-500"
            }`}
          >
            {label}
          </button>
        );
      })()}

      <div className="relative">
        <button
          onClick={() => setShowMoveDropdown(!showMoveDropdown)}
          disabled={bulkMutation.isPending}
          className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
        >
          Move
        </button>

        {showMoveDropdown && (
          <div className="absolute bottom-full left-0 mb-2 bg-white text-slate-900 rounded-lg shadow-xl border border-slate-200 w-56 max-h-64 overflow-y-auto">
            {rooms.map((room) => (
              <button
                key={room.room_folder}
                onClick={() =>
                  bulkMutation.mutate({
                    action: "move",
                    target_room: room.room_folder,
                    target_room_display_name: room.room_display_name,
                  })
                }
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
              >
                {room.room_display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-slate-700" />

      <button
        onClick={onClear}
        className="px-2 py-1 text-sm text-slate-400 hover:text-white transition-colors"
      >
        Clear
      </button>
    </div>
  );
}
