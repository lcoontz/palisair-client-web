import { TAX_RATE } from "./constants";

/**
 * Calculate total cost for an item.
 * Formula: (price * (1 + TAX_RATE) * ceil(qty / units_per_product)) + shipping
 */
export function calculateTotalCost(
  price: number,
  quantity: number,
  unitsPerProduct: number,
  shippingCost: number
): number {
  const effectiveUnits = unitsPerProduct > 0 ? unitsPerProduct : 1;
  const packagesNeeded = Math.ceil(quantity / effectiveUnits);
  const total = price * (1 + TAX_RATE) * packagesNeeded + shippingCost;
  return Math.round(total * 100) / 100;
}

/**
 * Calculate tax amount for a given price.
 */
export function calculateTax(price: number): number {
  return Math.round(price * TAX_RATE * 100) / 100;
}

/**
 * Parse a currency string into a number.
 * Strips $, commas, and other non-numeric characters.
 */
export function parseCurrency(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return value;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format a number as USD currency.
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "$0.00";
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
