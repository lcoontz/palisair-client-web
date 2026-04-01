"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { PhotoAudit, PhotoAuditRoom } from "@/lib/photo-audit/types";
import { usePhotoItems } from "../hooks/usePhotoItems";
import { usePhotoMutation } from "../hooks/usePhotoMutation";
import { BoundingBoxCanvas } from "./BoundingBoxCanvas";
import { MoveDialog } from "./MoveDialog";

const AUDIT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  final: { bg: "bg-emerald-50", text: "text-emerald-700" },
  needs_review: { bg: "bg-amber-50", text: "text-amber-700" },
  duplicate: { bg: "bg-blue-50", text: "text-blue-700" },
  wrong: { bg: "bg-red-50", text: "text-red-700" },
};

export function PhotoExpanded({
  photo,
  rooms,
  token,
  showBboxes,
  onClose,
  onPrev,
  onNext,
}: {
  photo: PhotoAudit;
  rooms: PhotoAuditRoom[];
  token: string;
  showBboxes: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [comment, setComment] = useState(photo.comment ?? "");
  const [commentDirty, setCommentDirty] = useState(false);
  const [localStatus, setLocalStatus] = useState(photo.status);
  const [localIsOverview, setLocalIsOverview] = useState(photo.is_overview);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showFlagMenu, setShowFlagMenu] = useState(false);
  const [imgDimensions, setImgDimensions] = useState({ w: 0, h: 0 });
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const { data: itemsData } = usePhotoItems(token, photo.id);
  const mutation = usePhotoMutation(token);
  const items = itemsData?.items ?? [];

  // Sync local state when photo prop changes (navigating prev/next)
  useEffect(() => {
    setComment(photo.comment ?? "");
    setCommentDirty(false);
    setLocalStatus(photo.status);
    setLocalIsOverview(photo.is_overview);
    setHoveredItemId(null);
    setShowFlagMenu(false);
  }, [photo.id, photo.comment, photo.status, photo.is_overview]);

  // Keyboard navigation
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (showMoveDialog) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    },
    [onClose, onPrev, onNext, showMoveDialog]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  function handleImageLoad() {
    if (imgRef.current) {
      setImgDimensions({
        w: imgRef.current.clientWidth,
        h: imgRef.current.clientHeight,
      });
    }
  }

  function handleFlag() {
    const next = localStatus === "flagged" ? "pending" : "flagged";
    setLocalStatus(next as PhotoAudit["status"]);
    mutation.mutate({
      photoId: photo.id,
      payload: {
        status: next,
        flag_reason: next === "flagged" ? "low_quality" : null,
      } as Partial<PhotoAudit>,
    });
  }

  function handleApprove() {
    const next = localStatus === "approved" ? "pending" : "approved";
    setLocalStatus(next as PhotoAudit["status"]);
    mutation.mutate({
      photoId: photo.id,
      payload: { status: next } as Partial<PhotoAudit>,
    });
  }

  function handleToggleOverview() {
    const next = !localIsOverview;
    setLocalIsOverview(next);
    mutation.mutate({
      photoId: photo.id,
      payload: { is_overview: next } as Partial<PhotoAudit>,
    });
  }

  function handleSaveComment() {
    mutation.mutate({
      photoId: photo.id,
      payload: { comment } as Partial<PhotoAudit>,
    });
  }

  // Show bboxes when globally on OR when hovering an item
  const showCanvas = showBboxes || hoveredItemId !== null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 bg-white rounded-xl shadow-2xl max-w-[90vw] max-h-[90vh] flex overflow-hidden">
        {/* Prev button */}
        <button
          onClick={onPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white text-slate-600"
        >
          &#8249;
        </button>

        {/* Next button */}
        <button
          onClick={onNext}
          className="absolute right-[380px] top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white text-slate-600"
        >
          &#8250;
        </button>

        {/* Main image area */}
        <div className="flex-1 bg-slate-100 flex items-center justify-center relative min-w-0">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={photo.photo_url}
              alt={photo.filename}
              className="max-h-[85vh] max-w-full object-contain"
              onLoad={handleImageLoad}
              referrerPolicy="no-referrer"
            />
            {showCanvas && imgDimensions.w > 0 && (
              <BoundingBoxCanvas
                items={items}
                imageWidth={imgDimensions.w}
                imageHeight={imgDimensions.h}
                highlightedItemId={hoveredItemId}
              />
            )}
          </div>
        </div>

        {/* Sidebar panel */}
        <div className="w-[360px] border-l border-slate-200 flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-slate-900 text-sm truncate">
                {photo.filename}
              </h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {photo.room_display_name} &middot; {photo.item_count} items
            </p>
            {photo.moved_from_room && (
              <p className="text-xs text-amber-600 mt-0.5">
                Moved from:{" "}
                {photo.moved_from_room
                  .replace("Palisair Photos/", "")
                  .replace(/\/$/, "")}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-b border-slate-200 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                className={`flex-1 py-1.5 text-sm rounded-lg border transition-colors ${
                  localStatus === "approved"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                {localStatus === "approved" ? "Approved" : "Approve"}
              </button>
              <div className="flex-1 relative">
                <button
                  onClick={() => {
                    if (localStatus === "flagged") {
                      handleFlag();
                    } else {
                      setShowFlagMenu(!showFlagMenu);
                    }
                  }}
                  className={`w-full py-1.5 text-sm rounded-lg border transition-colors ${
                    localStatus === "flagged"
                      ? "bg-red-600 text-white border-red-600"
                      : "border-red-300 text-red-700 hover:bg-red-50"
                  }`}
                >
                  {localStatus === "flagged" ? "Unflag" : "Flag"}
                </button>
                {showFlagMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 w-48 overflow-hidden">
                    {[
                      { value: "low_quality", label: "Low quality" },
                      { value: "duplicate_photo", label: "Duplicate photo" },
                      { value: "missing_detail", label: "Missing photo detail" },
                      { value: "missing_detections", label: "Missing detections" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setShowFlagMenu(false);
                          setLocalStatus("flagged");
                          mutation.mutate({
                            photoId: photo.id,
                            payload: {
                              status: "flagged",
                              flag_reason: opt.value,
                            } as Partial<PhotoAudit>,
                          });
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowMoveDialog(true)}
              className="w-full py-1.5 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Move to another room
            </button>

            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={localIsOverview}
                onChange={handleToggleOverview}
                className="rounded border-slate-300"
              />
              Overview shot
            </label>
          </div>

          {/* Comment */}
          <div className="p-4 border-b border-slate-200">
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setCommentDirty(true);
              }}
              rows={2}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              placeholder="Add a note..."
            />
            {commentDirty && (
              <button
                onClick={() => {
                  handleSaveComment();
                  setCommentDirty(false);
                }}
                className="mt-1.5 px-3 py-1 text-xs bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Save comment
              </button>
            )}
          </div>

          {/* Detected items — hover to highlight bbox */}
          <div className="p-4 flex-1">
            <h4 className="text-xs font-medium text-slate-500 mb-2">
              Detected items ({items.length})
              {!showBboxes && items.length > 0 && (
                <span className="text-slate-400 font-normal">
                  {" "}
                  — hover to show box
                </span>
              )}
            </h4>
            <div className="space-y-0.5">
              {items.map((item) => {
                const statusStyle =
                  AUDIT_STATUS_COLORS[item.audit_status] ??
                  AUDIT_STATUS_COLORS.needs_review;
                const isHovered = hoveredItemId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 text-xs px-1.5 py-1 rounded cursor-pointer transition-colors ${
                      isHovered ? "bg-blue-50" : "hover:bg-slate-50"
                    }`}
                    onMouseEnter={() => setHoveredItemId(item.id)}
                    onMouseLeave={() => setHoveredItemId(null)}
                  >
                    <span
                      className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${statusStyle.bg} ${statusStyle.text}`}
                    >
                      {item.audit_status === "needs_review"
                        ? "review"
                        : item.audit_status}
                    </span>
                    <span className="text-slate-700 truncate">
                      {item.item_name}
                    </span>
                    {item.confidence && (
                      <span className="text-slate-400 shrink-0">
                        {item.confidence}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Move dialog */}
      {showMoveDialog && (
        <MoveDialog
          photo={photo}
          rooms={rooms}
          token={token}
          onClose={() => setShowMoveDialog(false)}
        />
      )}
    </div>
  );
}
