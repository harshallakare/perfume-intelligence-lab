// ─── Pricing & margin maths ────────────────────────────────────────────────
// "Gross margin" is expressed on the selling price; "markup" is expressed on cost.
// A ₹40 cost sold at ₹100 → 60% margin, 150% markup.

/** Total batch cost from components (falls back gracefully when some are null). */
export function batchCost(
  materialCost?: number | null,
  packagingCost?: number | null,
  laborCost?: number | null,
): number {
  return (materialCost ?? 0) + (packagingCost ?? 0) + (laborCost ?? 0);
}

/** Cost per bottle. */
export function unitCost(totalBatchCost: number, bottles: number): number {
  return bottles > 0 ? totalBatchCost / bottles : 0;
}

/** Gross margin % on the selling price. */
export function marginPct(price: number, cost: number): number {
  return price > 0 ? ((price - cost) / price) * 100 : 0;
}

/** Markup % over cost. */
export function markupPct(price: number, cost: number): number {
  return cost > 0 ? ((price - cost) / cost) * 100 : 0;
}

/** Suggested selling price to hit a target gross margin. */
export function priceForMargin(cost: number, targetMarginPct: number): number {
  const m = Math.min(Math.max(targetMarginPct, 0), 99.9) / 100;
  return cost > 0 ? cost / (1 - m) : 0;
}

/** Profit per bottle. */
export function unitProfit(price: number, cost: number): number {
  return price - cost;
}

/** A colour for a margin figure — green healthy, amber thin, red loss. */
export function marginColor(margin: number): string {
  if (margin <= 0) return "#ef4444";
  if (margin < 30) return "#eab308";
  return "#22c55e";
}

/** Yield % = actual bottles filled ÷ planned bottles. */
export function yieldPct(filled: number, planned?: number | null): number | null {
  if (!planned || planned <= 0) return null;
  return (filled / planned) * 100;
}
