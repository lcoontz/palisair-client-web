"use client";

import { formatCurrency } from "@/lib/pricing";

interface StatsCardsProps {
  totalItems: number;
  totalValue: number;
  pricedCount: number;
  clientReviewCount?: number;
}

export function StatsCards({ totalItems, totalValue, pricedCount, clientReviewCount }: StatsCardsProps) {
  const cards = [
    { label: "Total Items", value: totalItems.toLocaleString() },
    { label: "Total Value", value: formatCurrency(totalValue) },
    { label: "Priced Items", value: pricedCount.toLocaleString() },
    { label: "Pending Review", value: (clientReviewCount ?? 0).toLocaleString() },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-slate-200 bg-white px-5 py-4"
        >
          <p className="text-sm font-medium text-slate-500">{card.label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
