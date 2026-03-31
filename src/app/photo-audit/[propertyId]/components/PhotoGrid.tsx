"use client";

import type { PhotoAudit } from "@/lib/photo-audit/types";
import { PhotoThumbnail } from "./PhotoThumbnail";

const DENSITY_COLS = {
  small: "grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10",
  medium: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  large: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
} as const;

interface PhotoGridProps {
  photos: PhotoAudit[];
  sortMode: "category" | "filename";
  density: "small" | "medium" | "large";
  isLoading: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onPhotoClick: (id: string) => void;
  showBboxes: boolean;
  token: string;
}

export function PhotoGrid({
  photos,
  sortMode,
  density,
  isLoading,
  selectedIds,
  onToggleSelect,
  onPhotoClick,
}: PhotoGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Loading photos...</div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">No photos in this room</div>
      </div>
    );
  }

  // Split into overview and non-overview
  const overviewPhotos = photos.filter((p) => p.is_overview);
  const detailPhotos = photos.filter((p) => !p.is_overview);

  // Group detail photos by category if in category mode
  const categoryGroups =
    sortMode === "category" ? groupByCategory(detailPhotos) : null;

  // Build secondary category badges data
  const secondaryBadges =
    sortMode === "category" ? buildSecondaryBadges(detailPhotos) : null;

  return (
    <div className="p-4 space-y-6">
      {/* Overview section */}
      {overviewPhotos.length > 0 && (
        <section>
          <SectionHeader
            title="Overview Shots"
            count={overviewPhotos.length}
          />
          <div className={`grid gap-2 ${DENSITY_COLS[density]}`}>
            {overviewPhotos.map((photo) => (
              <PhotoThumbnail
                key={photo.id}
                photo={photo}
                isSelected={selectedIds.has(photo.id)}
                onToggleSelect={() => onToggleSelect(photo.id)}
                onClick={() => onPhotoClick(photo.id)}
                density={density}
              />
            ))}
          </div>
        </section>
      )}

      {/* Detail photos — by category or flat */}
      {sortMode === "category" && categoryGroups ? (
        categoryGroups.map(({ category, photos: catPhotos }) => (
          <section key={category}>
            <SectionHeader title={category} count={catPhotos.length} />
            <div className={`grid gap-2 ${DENSITY_COLS[density]}`}>
              {catPhotos.map((photo) => (
                <PhotoThumbnail
                  key={photo.id}
                  photo={photo}
                  isSelected={selectedIds.has(photo.id)}
                  onToggleSelect={() => onToggleSelect(photo.id)}
                  onClick={() => onPhotoClick(photo.id)}
                  density={density}
                />
              ))}
            </div>

            {/* Secondary category badges */}
            {secondaryBadges && secondaryBadges.has(category) && (
              <SecondaryBadges
                category={category}
                badges={secondaryBadges.get(category)!}
                onPhotoClick={onPhotoClick}
              />
            )}
          </section>
        ))
      ) : (
        <section>
          {detailPhotos.length > 0 && (
            <>
              {overviewPhotos.length > 0 && (
                <SectionHeader
                  title="Detail Shots"
                  count={detailPhotos.length}
                />
              )}
              <div className={`grid gap-2 ${DENSITY_COLS[density]}`}>
                {detailPhotos.map((photo) => (
                  <PhotoThumbnail
                    key={photo.id}
                    photo={photo}
                    isSelected={selectedIds.has(photo.id)}
                    onToggleSelect={() => onToggleSelect(photo.id)}
                    onClick={() => onPhotoClick(photo.id)}
                    density={density}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
        {count}
      </span>
    </div>
  );
}

function groupByCategory(photos: PhotoAudit[]) {
  const groups = new Map<string, PhotoAudit[]>();

  for (const photo of photos) {
    const cat = photo.primary_category ?? "Uncategorized";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(photo);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, catPhotos]) => ({ category, photos: catPhotos }));
}

/**
 * Build secondary badges: for each category, find photos primarily filed
 * under OTHER categories that also contain items in THIS category.
 */
function buildSecondaryBadges(photos: PhotoAudit[]) {
  const badges = new Map<
    string,
    { category: string; photoId: string; photoUrl: string }[]
  >();

  for (const photo of photos) {
    if (!photo.all_categories) continue;
    const primary = photo.primary_category;
    for (const cat of photo.all_categories) {
      if (cat === primary) continue;
      if (!badges.has(cat)) badges.set(cat, []);
      badges.get(cat)!.push({
        category: primary ?? "Uncategorized",
        photoId: photo.id,
        photoUrl: photo.thumbnail_url ?? photo.photo_url,
      });
    }
  }

  return badges;
}

function SecondaryBadges({
  category,
  badges,
  onPhotoClick,
}: {
  category: string;
  badges: { category: string; photoId: string; photoUrl: string }[];
  onPhotoClick: (id: string) => void;
}) {
  if (badges.length === 0) return null;

  // Group by source category
  const bySource = new Map<string, typeof badges>();
  for (const b of badges) {
    if (!bySource.has(b.category)) bySource.set(b.category, []);
    bySource.get(b.category)!.push(b);
  }

  return (
    <details className="mt-2">
      <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
        Also contains {category}: {badges.length} photo
        {badges.length !== 1 ? "s" : ""} filed under{" "}
        {Array.from(bySource.keys()).join(", ")}
      </summary>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {badges.slice(0, 20).map((b) => (
          <button
            key={b.photoId}
            onClick={() => onPhotoClick(b.photoId)}
            className="w-12 h-12 rounded overflow-hidden border border-slate-200 hover:border-blue-400 transition-colors"
            title={`Filed under: ${b.category}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={b.photoUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
        {badges.length > 20 && (
          <span className="text-xs text-slate-400 self-center">
            +{badges.length - 20} more
          </span>
        )}
      </div>
    </details>
  );
}
