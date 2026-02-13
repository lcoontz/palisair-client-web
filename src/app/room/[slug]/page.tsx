"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { ItemsList } from "@/components/items/ItemsList";

function RoomContent() {
  const params = useParams();
  const slug = decodeURIComponent(params.slug as string);

  const displayName = slug
    .replace(/_batch(_new)?$/, "")
    .replace(/^_?\d+_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return <ItemsList room={slug} title={displayName} subtitle={slug} />;
}

export default function RoomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400">Loading...</div>
        </div>
      }
    >
      <RoomContent />
    </Suspense>
  );
}
