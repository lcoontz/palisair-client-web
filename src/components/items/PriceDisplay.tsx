"use client";

import { formatCurrency } from "@/lib/pricing";

interface PriceDisplayProps {
  price: number | null;
  shippingCost: number | null;
  tax: number | null;
  totalCost: number | null;
  quantity: number;
}

export function PriceDisplay({
  price,
  shippingCost,
  tax,
  totalCost,
  quantity,
}: PriceDisplayProps) {
  return (
    <div className="mt-3">
      <div className="flex items-baseline gap-3 text-sm text-slate-500">
        <span>Price: {formatCurrency(price)}</span>
        <span>+ Ship: {formatCurrency(shippingCost)}</span>
        <span>+ Tax: {formatCurrency(tax)}</span>
      </div>
      <div className="mt-1 border-t border-slate-200 pt-1 text-lg font-extrabold text-slate-900">
        Total: {formatCurrency(totalCost)}
        <span className="ml-2 text-sm font-normal text-slate-400">
          (x{quantity})
        </span>
      </div>
    </div>
  );
}
