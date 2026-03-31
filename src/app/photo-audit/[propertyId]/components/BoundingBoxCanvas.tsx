"use client";

import { useRef, useEffect } from "react";
import type { PhotoItem } from "@/lib/photo-audit/types";

const COLORS = [
  [50, 150, 255], // blue
  [34, 197, 94], // green
  [234, 179, 8], // yellow
  [168, 85, 247], // purple
  [239, 68, 68], // red
  [20, 184, 166], // teal
  [249, 115, 22], // orange
  [236, 72, 153], // pink
];

export function BoundingBoxCanvas({
  items,
  imageWidth,
  imageHeight,
  highlightedItemId,
}: {
  items: PhotoItem[];
  imageWidth: number;
  imageHeight: number;
  highlightedItemId?: string | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || imageWidth === 0 || imageHeight === 0) return;

    canvas.width = imageWidth;
    canvas.height = imageHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, imageWidth, imageHeight);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.bounding_box || item.bounding_box.length < 4) continue;

      const isHighlighted = highlightedItemId === item.id;
      const isDimmed = highlightedItemId && !isHighlighted;

      const [ymin, xmin, ymax, xmax] = item.bounding_box;
      const color = COLORS[i % COLORS.length];

      const x = (xmin / 1000) * imageWidth;
      const y = (ymin / 1000) * imageHeight;
      const w = ((xmax - xmin) / 1000) * imageWidth;
      const h = ((ymax - ymin) / 1000) * imageHeight;

      const alpha = isDimmed ? 0.15 : isHighlighted ? 1 : 0.7;

      // Draw box
      ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
      ctx.lineWidth = isHighlighted ? 4 : 2;
      ctx.strokeRect(x, y, w, h);

      // Draw label (skip if dimmed)
      if (!isDimmed) {
        const label =
          item.item_name.length > 30
            ? item.item_name.slice(0, 28) + "..."
            : item.item_name;

        ctx.font = "bold 11px -apple-system, sans-serif";
        const textWidth = ctx.measureText(label).width;

        const labelY = y > 16 ? y - 4 : y + h + 14;

        ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.85)`;
        ctx.fillRect(x, labelY - 12, textWidth + 8, 16);

        ctx.fillStyle = "white";
        ctx.fillText(label, x + 4, labelY);
      }
    }
  }, [items, imageWidth, imageHeight, highlightedItemId]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ imageRendering: "auto" }}
    />
  );
}
