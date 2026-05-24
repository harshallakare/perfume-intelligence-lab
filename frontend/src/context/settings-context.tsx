"use client";

import { createContext, useContext, useState, useEffect } from "react";

/* ── Currency map ─────────────────────────────────────────────────── */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
};

/* ── Context shape ────────────────────────────────────────────────── */
interface SettingsCtx {
  currency: string;
  sym: string;
  setCurrency: (c: string) => void;
  /** Format a number as a currency string — `fmt(1234.5)` → "₹1234.50" */
  fmt: (n: number, decimals?: number) => string;
}

const DEFAULT_CTX: SettingsCtx = {
  currency: "INR",
  sym: "₹",
  setCurrency: () => {},
  fmt: (n, d = 2) => `₹${n.toFixed(d)}`,
};

export const SettingsContext = createContext<SettingsCtx>(DEFAULT_CTX);

/* ── Provider ─────────────────────────────────────────────────────── */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState("INR");

  // Hydrate: localStorage first (instant), then DB (authoritative)
  useEffect(() => {
    // 1. Restore from localStorage immediately so UI isn't blank
    const saved = localStorage.getItem("pil_currency");
    if (saved && CURRENCY_SYMBOLS[saved]) setCurrencyState(saved);

    // 2. Then fetch from DB — DB wins if it differs
    fetch("/api/settings")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.currency && CURRENCY_SYMBOLS[data.currency]) {
          setCurrencyState(data.currency);
          localStorage.setItem("pil_currency", data.currency);
        }
      })
      .catch(() => {}); // fail silently — localStorage fallback already applied
  }, []);

  const setCurrency = (c: string) => {
    setCurrencyState(c);
    localStorage.setItem("pil_currency", c);
  };

  const sym = CURRENCY_SYMBOLS[currency] ?? currency;
  const fmt = (n: number, decimals = 2) => `${sym}${n.toFixed(decimals)}`;

  return (
    <SettingsContext.Provider value={{ currency, sym, setCurrency, fmt }}>
      {children}
    </SettingsContext.Provider>
  );
}

/* ── Hook ─────────────────────────────────────────────────────────── */
export const useSettings = () => useContext(SettingsContext);
