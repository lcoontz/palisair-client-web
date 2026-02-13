"use client";

import { STATUS_CONFIG } from "@/lib/constants";

interface StatusBadgeProps {
  status: string | null;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const key = status || "";
  const config = STATUS_CONFIG[key] || STATUS_CONFIG[""];

  if (!status) return null;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase"
      style={{
        backgroundColor: config.color,
        color: config.textColor,
      }}
    >
      {config.emoji} {status}
    </span>
  );
}
