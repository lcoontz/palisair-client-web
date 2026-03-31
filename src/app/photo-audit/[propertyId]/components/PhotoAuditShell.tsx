"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { AuditSidebar } from "./AuditSidebar";
import { PhotoGrid } from "./PhotoGrid";
import { PhotoExpanded } from "./PhotoExpanded";
import { BulkActionBar } from "./BulkActionBar";
import { usePhotoAuditRooms } from "../hooks/usePhotoAuditRooms";
import { usePhotoAuditPhotos } from "../hooks/usePhotoAuditPhotos";

export function PhotoAuditShell({
  token,
}: {
  propertyId: string;
  token: string;
}) {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<"category" | "filename">("filename");
  const [density, setDensity] = useState<"small" | "medium" | "large">("medium");
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(
    new Set()
  );
  const [expandedPhotoId, setExpandedPhotoId] = useState<string | null>(null);
  const [showBboxes, setShowBboxes] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: roomsData, isLoading: roomsLoading } =
    usePhotoAuditRooms(token);

  // Auto-select first room
  const rooms = roomsData?.rooms ?? [];
  const effectiveRoom =
    selectedRoom ?? (rooms.length > 0 ? rooms[0].room_folder : null);

  const {
    data: photosInfinite,
    isLoading: photosLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePhotoAuditPhotos(token, effectiveRoom, sortMode);

  // Flatten all pages into a single array
  const photos = useMemo(
    () => photosInfinite?.pages.flatMap((p) => p.photos) ?? [],
    [photosInfinite]
  );

  const totalPhotos = photosInfinite?.pages[0]?.total ?? 0;

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: "400px",
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleObserver]);

  function togglePhotoSelection(id: string) {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedPhotoIds(new Set());
  }

  function handleRoomChange(room: string) {
    setSelectedRoom(room);
    clearSelection();
    // Scroll to top when changing rooms
    scrollRef.current?.scrollTo(0, 0);
  }

  // Find expanded photo data for the modal
  const expandedPhoto = expandedPhotoId
    ? photos.find((p) => p.id === expandedPhotoId) ?? null
    : null;

  // Navigate to prev/next photo in expanded view
  function navigateExpanded(direction: -1 | 1) {
    if (!expandedPhotoId) return;
    const idx = photos.findIndex((p) => p.id === expandedPhotoId);
    if (idx === -1) return;
    const nextIdx = idx + direction;
    if (nextIdx >= 0 && nextIdx < photos.length) {
      setExpandedPhotoId(photos[nextIdx].id);
    }
  }

  return (
    <div className="flex h-full">
      <AuditSidebar
        rooms={rooms}
        selectedRoom={effectiveRoom}
        onSelectRoom={handleRoomChange}
        isLoading={roomsLoading}
        token={token}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              {effectiveRoom
                ? effectiveRoom
                    .replace("Palisair Photos/", "")
                    .replace(/\/$/, "")
                : "Select a room"}
            </h1>
            {totalPhotos > 0 && (
              <p className="text-sm text-slate-500">
                {photos.length} of {totalPhotos} photos loaded
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Bbox toggle */}
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showBboxes}
                onChange={(e) => setShowBboxes(e.target.checked)}
                className="rounded border-slate-300"
              />
              Show boxes
            </label>

            {/* Sort toggle */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
              <button
                onClick={() => setSortMode("filename")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  sortMode === "filename"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                By filename
              </button>
              <button
                onClick={() => setSortMode("category")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  sortMode === "category"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                By category
              </button>
            </div>

            {/* Density slider */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
              {(["small", "medium", "large"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDensity(d)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                    density === d
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {d === "small" ? "S" : d === "medium" ? "M" : "L"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Photo grid with infinite scroll */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <PhotoGrid
            photos={photos}
            sortMode={sortMode}
            density={density}
            isLoading={photosLoading}
            selectedIds={selectedPhotoIds}
            onToggleSelect={togglePhotoSelection}
            onPhotoClick={setExpandedPhotoId}
            showBboxes={showBboxes}
            token={token}
          />

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />

          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-4">
              <span className="text-sm text-slate-400">
                Loading more photos...
              </span>
            </div>
          )}

          {!hasNextPage && photos.length > 0 && (
            <div className="flex items-center justify-center py-4">
              <span className="text-xs text-slate-300">
                All {totalPhotos} photos loaded
              </span>
            </div>
          )}
        </div>

        {/* Bulk action bar */}
        {selectedPhotoIds.size > 0 && (
          <BulkActionBar
            selectedCount={selectedPhotoIds.size}
            selectedIds={selectedPhotoIds}
            selectedPhotos={photos.filter(p => selectedPhotoIds.has(p.id))}
            rooms={rooms}
            token={token}
            onClear={clearSelection}
          />
        )}
      </div>

      {/* Expanded photo modal */}
      {expandedPhoto && (
        <PhotoExpanded
          photo={expandedPhoto}
          rooms={rooms}
          token={token}
          showBboxes={showBboxes}
          onClose={() => setExpandedPhotoId(null)}
          onPrev={() => navigateExpanded(-1)}
          onNext={() => navigateExpanded(1)}
        />
      )}
    </div>
  );
}
