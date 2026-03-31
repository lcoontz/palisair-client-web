"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PhotoAuditRoom } from "@/lib/photo-audit/types";

export function AuditSidebar({
  rooms,
  selectedRoom,
  onSelectRoom,
  isLoading,
  token,
}: {
  rooms: PhotoAuditRoom[];
  selectedRoom: string | null;
  onSelectRoom: (room: string) => void;
  isLoading: boolean;
  token: string;
}) {
  const [confirmingRoom, setConfirmingRoom] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const approveAllMutation = useMutation({
    mutationFn: async (roomFolder: string) => {
      // Fetch all pending photo IDs for this room
      const res = await fetch(
        `/api/photo-audit/photos?token=${encodeURIComponent(token)}&room=${encodeURIComponent(roomFolder)}&pageSize=2000`
      );
      const data = await res.json();
      const pendingIds = (data.photos ?? [])
        .filter((p: { status: string }) => p.status === "pending")
        .map((p: { id: string }) => p.id);

      if (pendingIds.length === 0) return;

      await fetch(
        `/api/photo-audit/photos/bulk?token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photo_ids: pendingIds, action: "approve" }),
        }
      );
    },
    onSuccess: () => {
      setConfirmingRoom(null);
      queryClient.invalidateQueries({ queryKey: ["photo-audit-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["photo-audit-photos"] });
    },
  });

  const totalPhotos = rooms.reduce((sum, r) => sum + r.total_photos, 0);
  const totalReviewed = rooms.reduce((sum, r) => sum + r.reviewed_count, 0);

  return (
    <div className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <Link
          href="/overview"
          className="text-xs text-blue-600 hover:text-blue-800 mb-2 block"
        >
          &larr; Back to Item Review
        </Link>
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
          Photo Audit
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {totalReviewed} of {totalPhotos} reviewed
        </p>
        {totalPhotos > 0 && (
          <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{
                width: `${(totalReviewed / totalPhotos) * 100}%`,
              }}
            />
          </div>
        )}
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="px-4 py-2 text-sm text-slate-400">
            Loading rooms...
          </div>
        ) : (
          rooms.map((room) => {
            const isSelected = room.room_folder === selectedRoom;
            const isComplete =
              room.reviewed_count === room.total_photos &&
              room.total_photos > 0;
            const progress =
              room.total_photos > 0
                ? (room.reviewed_count / room.total_photos) * 100
                : 0;

            return (
              <div key={room.room_folder}>
                <button
                  onClick={() => onSelectRoom(room.room_folder)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    isSelected
                      ? "bg-white border-r-2 border-blue-600 font-medium text-slate-900"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate flex items-center gap-1.5">
                      {isComplete && (
                        <span className="text-emerald-500 text-xs">&#10003;</span>
                      )}
                      {room.room_display_name}
                    </span>
                    <span className="text-xs text-slate-400 ml-2 shrink-0">
                      {room.total_photos}
                    </span>
                  </div>

                  {/* Progress bar */}
                  {room.total_photos > 0 && (
                    <div className="mt-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isComplete ? "bg-emerald-500" : "bg-blue-400"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  {/* Counts */}
                  {(room.approved_count > 0 || room.flagged_count > 0) && (
                    <div className="flex gap-2 mt-1 text-xs">
                      {room.approved_count > 0 && (
                        <span className="text-emerald-600">
                          {room.approved_count} ok
                        </span>
                      )}
                      {room.flagged_count > 0 && (
                        <span className="text-red-500">
                          {room.flagged_count} flagged
                        </span>
                      )}
                    </div>
                  )}
                </button>

                {/* Approve all button for selected room */}
                {isSelected && !isComplete && room.total_photos > 0 && (
                  <div className="px-4 py-1.5">
                    {confirmingRoom === room.room_folder ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            approveAllMutation.mutate(room.room_folder)
                          }
                          disabled={approveAllMutation.isPending}
                          className="flex-1 text-xs py-1 px-2 text-white bg-emerald-600 border border-emerald-600 rounded hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                          {approveAllMutation.isPending
                            ? "Approving..."
                            : `Yes, approve ${room.total_photos - room.reviewed_count}`}
                        </button>
                        <button
                          onClick={() => setConfirmingRoom(null)}
                          className="text-xs py-1 px-2 text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingRoom(room.room_folder)}
                        className="w-full text-xs py-1 px-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
                      >
                        Approve all remaining ({room.total_photos - room.reviewed_count})
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
