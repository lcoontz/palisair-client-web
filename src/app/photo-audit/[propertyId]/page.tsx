"use client";

import { PhotoAuditShell } from "./components/PhotoAuditShell";

export default function Page() {
  // No token needed — client app has no auth layer
  // Pass a dummy token; the API routes still validate but we'll use a fixed one
  return (
    <div className="fixed inset-0 z-50 bg-white text-slate-900 overflow-hidden">
      <PhotoAuditShell
        propertyId="palisair"
        token="palisair-photo-review-2026"
      />
    </div>
  );
}
