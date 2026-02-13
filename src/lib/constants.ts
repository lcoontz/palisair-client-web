export const PROJECT_ID = "flow-contents";
export const DATASET_ID = "palisair_contents";
export const BUCKET_NAME = "palisair_contents";

export const PAGE_SIZE = 20;

export const TAX_RATE = 0.0975;

export const STATUS_CONFIG: Record<
  string,
  { emoji: string; color: string; textColor: string }
> = {
  "": { emoji: "\u26AA", color: "transparent", textColor: "#94a3b8" },
  "wrong product": {
    emoji: "\u274C",
    color: "#fee2e2",
    textColor: "#991b1b",
  },
  "wrong detection": {
    emoji: "\u26A0\uFE0F",
    color: "#fef3c7",
    textColor: "#92400e",
  },
  duplicate: { emoji: "\uD83D\uDD87\uFE0F", color: "#e0f2fe", textColor: "#075985" },
  "price low": { emoji: "\uD83D\uDCC9", color: "#dcfce7", textColor: "#166534" },
  "price high": { emoji: "\uD83D\uDCC8", color: "#dcfce7", textColor: "#166534" },
  "low quality image": {
    emoji: "\uD83D\uDDBC\uFE0F",
    color: "#f1f5f9",
    textColor: "#475569",
  },
  "broken link": {
    emoji: "\uD83D\uDD17",
    color: "#f1f5f9",
    textColor: "#475569",
  },
  "RE-RUN": { emoji: "\uD83D\uDD04", color: "#ede9fe", textColor: "#5b21b6" },
  final: { emoji: "\u2705", color: "#dcfce7", textColor: "#166534" },
  "client review": { emoji: "\uD83D\uDC41\uFE0F", color: "#dbeafe", textColor: "#1e40af" },
};

export const EXCLUDED_STATUSES = [
  "wrong product",
  "wrong detection",
  "duplicate",
  "low quality image",
  "broken link",
];

// Client can only set these statuses
export const CLIENT_ACTION_OPTIONS = ["client review", "final"] as const;

// Preset feedback options for client
export const CLIENT_FEEDBACK_OPTIONS = [
  "Price too high",
  "Better link needed",
  "Wrong item",
  "Quantity incorrect",
] as const;

// Default visibility: only items relevant to client
export const CLIENT_VISIBLE_STATUSES = ["final", "client review"];

export const SORT_OPTIONS = [
  { label: "Price: High to Low", value: "total_cost.desc" },
  { label: "Price: Low to High", value: "total_cost.asc" },
  { label: "Quantity: High to Low", value: "quantity.desc" },
  { label: "Quantity: Low to High", value: "quantity.asc" },
] as const;

export const STATUS_FILTER_OPTIONS = [
  "All Statuses",
  "final",
  "client review",
];
