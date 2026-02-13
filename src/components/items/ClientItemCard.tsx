"use client";

import { useState, useCallback } from "react";
import { Item } from "@/types";
import { useItemMutation } from "@/hooks/useItemMutation";
import { StatusBadge } from "./StatusBadge";
import { PriceDisplay } from "./PriceDisplay";
import { CopyButton } from "@/components/ui/CopyButton";
import { ImageZoomModal } from "@/components/ui/ImageZoomModal";
import { Toast } from "@/components/ui/Toast";
import { CLIENT_FEEDBACK_OPTIONS, EXCLUDED_STATUSES, STATUS_CONFIG, BUCKET_NAME } from "@/lib/constants";

interface ClientItemCardProps {
  item: Item;
}

export function ClientItemCard({ item }: ClientItemCardProps) {
  const mutation = useItemMutation();

  const [targetPrice, setTargetPrice] = useState(item.target_price || 0);
  const [feedback, setFeedback] = useState("");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const isClientReview = item.review_action === "client review";
  const isExcluded = EXCLUDED_STATUSES.includes(item.review_action || "");
  const statusConfig = STATUS_CONFIG[item.review_action || ""] || STATUS_CONFIG[""];

  const handleApprove = useCallback(() => {
    mutation.mutate(
      {
        rowId: item.row_id,
        roomSlug: item.room_slug,
        payload: { review_action: "final" },
      },
      {
        onSuccess: () => {
          setToastMessage("Approved as Final");
          setToastVisible(true);
        },
      }
    );
  }, [item.row_id, item.room_slug, mutation]);

  const handleSaveTargetPrice = useCallback(() => {
    mutation.mutate(
      {
        rowId: item.row_id,
        roomSlug: item.room_slug,
        payload: { target_price: targetPrice || null },
      },
      {
        onSuccess: () => {
          setToastMessage("Target price updated");
          setToastVisible(true);
        },
      }
    );
  }, [targetPrice, item.row_id, item.room_slug, mutation]);

  const handleSendFeedback = useCallback(() => {
    const parts = [feedback, feedbackNote].filter(Boolean);
    const fullFeedback = parts.join(" | ");

    if (!fullFeedback) return;

    mutation.mutate(
      {
        rowId: item.row_id,
        roomSlug: item.room_slug,
        payload: { client_feedback: fullFeedback },
      },
      {
        onSuccess: () => {
          setToastMessage("Feedback sent");
          setToastVisible(true);
          setFeedback("");
          setFeedbackNote("");
        },
      }
    );
  }, [feedback, feedbackNote, item.row_id, item.room_slug, mutation]);

  // Build full photo URL
  const photoFilenames = (item.images_found_in || "").split(",");
  const firstPhoto = photoFilenames[0]?.trim();
  const fullPhotoUrl =
    firstPhoto && firstPhoto !== "None"
      ? `https://storage.googleapis.com/${BUCKET_NAME}/${firstPhoto.replace(/ /g, "%20")}`
      : null;

  return (
    <>
      <div
        className={`rounded-xl border transition-all ${
          isExcluded
            ? "border-dashed border-slate-300 opacity-70"
            : "border-slate-200"
        }`}
        style={{
          backgroundColor:
            statusConfig.color !== "transparent"
              ? statusConfig.color + "20"
              : "#ffffff",
        }}
      >
        {isExcluded && (
          <div className="border-b border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500">
            {item.review_action} — Excluded from totals
          </div>
        )}

        <div className="grid grid-cols-[1fr_2fr_2fr] gap-4 p-4">
          {/* Column 1: Image */}
          <div className={isExcluded ? "opacity-50" : ""}>
            {item.cropped_image_url ? (
              <div
                className="cursor-pointer overflow-hidden rounded-lg border border-slate-200"
                onClick={() => setZoomImage(item.cropped_image_url!)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.cropped_image_url}
                  alt={item.item}
                  className="w-full object-contain"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-400">
                No Image
              </div>
            )}

            {fullPhotoUrl && (
              <div className="mt-2 space-y-1">
                <a
                  href={fullPhotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-center text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                >
                  View Full Photo
                </a>
                <CopyButton text={fullPhotoUrl} label="Copy Link" className="w-full" />
                <p className="truncate text-xs text-slate-400">
                  {firstPhoto?.split("/").pop()}
                </p>
              </div>
            )}
          </div>

          {/* Column 2: Details (read-only) */}
          <div className={isExcluded ? "opacity-50" : ""}>
            <h3 className="text-lg font-bold text-slate-900">{item.item}</h3>
            <p className="mt-1 text-sm text-slate-500">
              <span className="font-semibold text-slate-700">Brand:</span>{" "}
              {item.brand || "-"}
            </p>
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">Features:</span>{" "}
              {item.features || "-"}
            </p>
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">Quantity:</span>{" "}
              {item.quantity}
            </p>
            {item.volume_or_size && (
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-700">Volume/Size:</span>{" "}
                {item.volume_or_size}
              </p>
            )}
            {item.item_description && (
              <p className="mt-2 text-sm text-slate-500">
                <span className="font-semibold text-slate-700">Description:</span>{" "}
                {item.item_description}
              </p>
            )}

            <PriceDisplay
              price={item.price}
              shippingCost={item.shipping_cost}
              tax={item.tax}
              totalCost={item.total_cost}
              quantity={item.quantity}
            />

            {item.product_name && (
              <p className="mt-2 text-xs text-slate-400">
                Match: {item.product_name}
              </p>
            )}

            {item.purchase_link && (
              <a
                href={item.purchase_link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-500 hover:underline"
              >
                Product Link &rarr;
              </a>
            )}

            <div className="mt-3">
              <StatusBadge status={item.review_action || ""} />
            </div>

            {item.review_note && (
              <div className="mt-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-600">Auditor Note:</span>{" "}
                {item.review_note}
              </div>
            )}
          </div>

          {/* Column 3: Client Actions */}
          <div className="space-y-4">
            {/* Approve Button (only for client review items) */}
            {isClientReview && (
              <button
                onClick={handleApprove}
                disabled={mutation.isPending}
                className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mutation.isPending ? "Approving..." : "Approve — Mark as Final"}
              </button>
            )}

            {/* Target Price */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Target Price ($)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step={1}
                  min={0}
                  value={targetPrice || ""}
                  onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                  placeholder="Set target price..."
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400"
                />
                <button
                  onClick={handleSaveTargetPrice}
                  disabled={mutation.isPending || targetPrice === (item.target_price || 0)}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Feedback Section */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Feedback
              </p>

              <select
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
              >
                <option value="">Select feedback type...</option>
                {CLIENT_FEEDBACK_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                placeholder="Additional details (optional)..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400"
              />

              <button
                onClick={handleSendFeedback}
                disabled={mutation.isPending || (!feedback && !feedbackNote)}
                className="w-full rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mutation.isPending ? "Sending..." : "Send Feedback"}
              </button>
            </div>

            {/* Existing Client Feedback */}
            {item.client_feedback && (
              <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                <span className="font-semibold">Your Feedback:</span>{" "}
                {item.client_feedback}
              </div>
            )}

            {mutation.isError && (
              <p className="text-xs text-red-600">
                Error: {mutation.error?.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomImage && (
        <ImageZoomModal
          src={zoomImage}
          alt={item.item}
          onClose={() => setZoomImage(null)}
        />
      )}

      {/* Save Toast */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onDone={() => setToastVisible(false)}
      />
    </>
  );
}
