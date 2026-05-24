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
