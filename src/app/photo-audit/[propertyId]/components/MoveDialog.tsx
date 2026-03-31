"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PhotoAudit, PhotoAuditRoom } from "@/lib/photo-audit/types";
import { useNearbyPhotos } from "../hooks/useNearbyPhotos";

export function MoveDialog({
  photo,
  rooms,
  token,
  onClose,
}: {
  photo: PhotoAudit;
  rooms: PhotoAuditRoom[];
  token: string;
  onClose: () => void;
}) {
  const [targetRoom, setTargetRoom] = useState("");
  const [includeNearby, setIncludeNearby] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: nearbyData, isLoading: nearbyLoading } = useNearbyPhotos(
    token,
    photo.id
  );
  const nearby = nearbyData?.nearby ?? [];

  const moveMutation = useMutation({
    mutationFn: async () => {
      const photoIds = [photo.id].concat(Array.from(includeNearby));
      const targetRoomData = rooms.find((r) => r.room_folder === targetRoom);

      const res = await fetch(
        `/api/photo-audit/photos/bulk?token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photo_ids: photoIds,
            action: "move",
            target_room: targetRoom,
            target_room_display_name: targetRoomData?.room_display_name,
          }),
        }
      );
      if (!res.ok) throw new Error("Move failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photo-audit-photos"] });
      queryClient.invalidateQueries({ queryKey: ["photo-audit-rooms"] });
      onClose();
    },
  });

  function toggleNearby(id: string) {
    setIncludeNearby((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const otherRooms = rooms.filter((r) => r.room_folder !== photo.room_folder);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 bg-white rounded-xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Move Photo</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {photo.filename} — currently in {photo.room_display_name}
          </p>
        </div>

        {/* Room picker */}
        <div className="p-4 border-b border-slate-200">
          <label className="text-sm font-medium text-slate-700 mb-1.5 block">
            Move to room
          </label>
          <select
            value={targetRoom}
            onChange={(e) => setTargetRoom(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select a room...</option>
            {otherRooms.map((room) => (
              <option key={room.room_folder} value={room.room_folder}>
                {room.room_display_name} ({room.total_photos} photos)
              </option>
            ))}
          </select>
        </div>

        {/* Nearby photos strip */}
        {nearby.length > 0 && (
          <div className="p-4 border-b border-slate-200">
            <details open={nearby.length <= 10}>
              <summary className="text-sm font-medium text-slate-700 cursor-pointer">
                Photos taken around the same time ({nearby.length})
              </summary>
              <p className="text-xs text-slate-500 mt-1 mb-2">
                Select any you want to move together
              </p>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {nearby.map((np) => (
                  <button
                    key={np.id}
                    onClick={() => toggleNearby(np.id)}
                    className={`relative w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                      includeNearby.has(np.id)
                        ? "border-blue-500"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={np.thumbnail_url ?? np.photo_url}
                      alt={np.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {includeNearby.has(np.id) && (
                      <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                        <span className="text-white text-xs font-bold bg-blue-600 w-4 h-4 rounded-full flex items-center justify-center">
                          &#10003;
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {includeNearby.size > 0 && (
                <p className="text-xs text-blue-600 mt-2">
                  {includeNearby.size + 1} photo
                  {includeNearby.size > 0 ? "s" : ""} will be moved
                </p>
              )}
            </details>
          </div>
        )}

        {nearbyLoading && (
          <div className="p-4 border-b border-slate-200">
            <p className="text-sm text-slate-400">
              Loading nearby photos...
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => moveMutation.mutate()}
            disabled={!targetRoom || moveMutation.isPending}
            className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {moveMutation.isPending
              ? "Moving..."
              : `Move ${1 + includeNearby.size} photo${includeNearby.size > 0 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
