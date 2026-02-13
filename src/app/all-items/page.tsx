"use client";

import { Suspense } from "react";
import { ItemsList } from "@/components/items/ItemsList";

function AllItemsContent() {
  return (
    <ItemsList
      title="All Items"
      subtitle="Cross-room view with full sort and filter"
    />
  );
}

export default function AllItemsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-400">Loading...</div>
        </div>
      }
    >
      <AllItemsContent />
    </Suspense>
  );
}
