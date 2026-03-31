"use client";

import type { PhotoAudit } from "@/lib/photo-audit/types";

const STATUS_COLORS = {
  pending: "",
  approved: "ring-2 ring-emerald-400",
  flagged: "ring-2 ring-red-400",
} as const;

const STATUS_DOT = {
  pending: "",
  approved: "bg-emerald-500",
  flagged: "bg-red-500",
} as const;

export function PhotoThumbnail({
  photo,
  isSelected,
  onToggleSelect,
  onClick,
  density,
}: {
  photo: PhotoAudit;
  isSelected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
  density: "small" | "medium" | "large";
}) {
  const aspectClass =
    density === "small" ? "aspect-square" : "aspect-[4/3]";

  return (
    <div
      className={`relative group rounded-lg overflow-hidden cursor-pointer border transition-all ${
        isSelected
          ? "border-blue-500 shadow-md"
          : "border-slate-200 hover:border-slate-300"
      } ${STATUS_COLORS[photo.status]}`}
      onClick={onClick}
    >
      <div className={aspectClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.thumbnail_url ?? photo.photo_url}
          alt={photo.filename}
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Checkbox overlay (top-left) */}
      <div
        className={`absolute top-1.5 left-1.5 transition-opacity ${
          isSelected
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
      >
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs ${
            isSelected
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white/80 border-slate-300 backdrop-blur-sm"
          }`}
        >
          {isSelected && "✓"}
        </div>
      </div>

      {/* Item count badge (top-right) */}
      <div className="absolute top-1.5 right-1.5">
        <span className="text-[10px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm">
          {photo.item_count}
        </span>
      </div>

      {/* Status dot + flag reason (bottom-left) */}
      {photo.status !== "pending" && (
        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
          <div
            className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[photo.status]}`}
          />
          {photo.status === "flagged" && photo.flag_reason && density !== "small" && (
            <span className="text-[9px] bg-red-500/80 text-white px-1 py-0.5 rounded backdrop-blur-sm">
              {photo.flag_reason === "low_quality"
                ? "LQ"
                : photo.flag_reason === "duplicate_photo"
                  ? "Dup"
                  : photo.flag_reason === "missing_detail"
                    ? "Miss"
                    : ""}
            </span>
          )}
        </div>
      )}

      {/* Link indicator */}
      {photo.link_group_id && (
        <div className="absolute top-1.5 right-8">
          <span className="text-[10px] font-medium bg-blue-500/80 text-white px-1 py-0.5 rounded backdrop-blur-sm">
            &#128279;
          </span>
        </div>
      )}

      {/* Overview badge */}
      {photo.is_overview && (
        <div className="absolute bottom-1.5 right-1.5">
          <span className="text-[9px] font-medium bg-blue-600/80 text-white px-1 py-0.5 rounded backdrop-blur-sm">
            OV
          </span>
        </div>
      )}

      {/* Moved indicator */}
      {photo.moved_from_room && (
        <div className="absolute bottom-1.5 right-1.5">
          <span className="text-[9px] font-medium bg-amber-500/80 text-white px-1 py-0.5 rounded backdrop-blur-sm">
            Moved
          </span>
        </div>
      )}

      {/* Filename on hover (medium/large only) */}
      {density !== "small" && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-[10px] text-white truncate">{photo.filename}</p>
        </div>
      )}
    </div>
  );
}
