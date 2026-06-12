import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: decimals }).format(n);
}

export function formatCurrency(n: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) return `${(grams / 1000).toFixed(2)} kg`;
  return `${grams.toFixed(2)} g`;
}

// Grams contained in one unit of the given unit-of-measure (mass units only).
const MASS_TO_G: Record<string, number> = { g: 1, kg: 1000, oz: 28.3495 };
// Millilitres contained in one unit of the given unit-of-measure (volume units only).
const VOL_TO_ML: Record<string, number> = { ml: 1, l: 1000, L: 1000 };

/**
 * Normalise a material's cost into both cost-per-gram and cost-per-mL.
 * `density` (g/mL) bridges weight and volume; defaults to 1.0 when unknown.
 * Returns nulls for a dimension that can't be derived without density.
 */
export function normalizedCost(
  costPerUnit: number,
  unit: string,
  density?: number | null,
): { perGram: number | null; perMl: number | null; assumedDensity: boolean } {
  const d = density && density > 0 ? density : 1.0;
  const assumedDensity = !(density && density > 0);
  const u = unit?.toLowerCase();

  if (u in MASS_TO_G) {
    const perGram = costPerUnit / MASS_TO_G[u];
    return { perGram, perMl: perGram * d, assumedDensity };
  }
  if (u === "ml" || u === "l") {
    const perMl = costPerUnit / VOL_TO_ML[u];
    return { perGram: perMl / d, perMl, assumedDensity };
  }
  // Unknown unit — treat the figure as already per-unit
  return { perGram: costPerUnit, perMl: costPerUnit * d, assumedDensity };
}

export function pctColor(pct: number): string {
  if (pct <= 0) return "badge-red";
  if (pct <= 30) return "badge-yellow";
  return "badge-green";
}

export function stockStatus(current: number, minimum: number): "healthy" | "low" | "out" {
  if (current <= 0) return "out";
  if (current <= minimum) return "low";
  return "healthy";
}

export function stockBadgeClass(status: "healthy" | "low" | "out"): string {
  return { healthy: "badge-green", low: "badge-yellow", out: "badge-red" }[status];
}

export function stockLabel(status: "healthy" | "low" | "out"): string {
  return { healthy: "In Stock", low: "Low Stock", out: "Out of Stock" }[status];
}

export function truncate(str: string, max = 40): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function concentrationLabel(type: string): string {
  const map: Record<string, string> = {
    edt: "EDT", edp: "EDP", parfum: "Parfum",
    extrait: "Extrait", attar: "Attar", cologne: "Cologne",
    body_spray: "Body Spray", oil_blend: "Oil Blend",
  };
  return map[type] ?? type.toUpperCase();
}

export function materialTypeLabel(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
