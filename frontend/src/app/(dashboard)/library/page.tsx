"use client";

import { Header } from "@/components/layout/header";
import { useState } from "react";
import { BookOpen, Search, Star, Clock, BarChart2 } from "lucide-react";

const PERFUMES = [
  { id: "1", name: "Sauvage EDP", brand: "Dior", year: 2018, perfumer: "François Demachy", concentration: "EDP", family: "Fresh Spicy", top_notes: ["Bergamot", "Sichuan Pepper"], mid_notes: ["Lavender", "Pink Pepper", "Vetiver", "Patchouli"], base_notes: ["Ambroxan", "Labdanum", "Vanilla"], projection: 9.0, longevity_hrs: 10, is_designer: true },
  { id: "2", name: "Aventus", brand: "Creed", year: 2010, perfumer: "Olivier Creed", concentration: "EDP", family: "Fruity Chypre", top_notes: ["Pineapple", "Bergamot", "Apple"], mid_notes: ["Rose", "Dry Birch", "Patchouli", "Jasmine"], base_notes: ["Oakmoss", "Ambergris", "Vanilla", "Musk"], projection: 8.5, longevity_hrs: 12, is_niche: true },
  { id: "3", name: "Bleu de Chanel EDP", brand: "Chanel", year: 2014, perfumer: "Olivier Polge", concentration: "EDP", family: "Aromatic Woody", top_notes: ["Citrus", "Grapefruit", "Mint"], mid_notes: ["Ginger", "Nutmeg", "Jasmine", "Iso E Super"], base_notes: ["Labdanum", "Vetiver", "Cedarwood", "Sandalwood"], projection: 8.0, longevity_hrs: 9, is_designer: true },
  { id: "4", name: "Tobacco Vanille", brand: "Tom Ford", year: 2007, perfumer: "Unknown", concentration: "EDP", family: "Oriental Spicy", top_notes: ["Tobacco", "Spices"], mid_notes: ["Tobacco Blossom", "Jasmine", "Cacao"], base_notes: ["Vanilla", "Dry Fruits", "Wood Sap", "Tonka Bean"], projection: 7.5, longevity_hrs: 14, is_designer: true },
  { id: "5", name: "Shalimar EDP", brand: "Guerlain", year: 1925, perfumer: "Jacques Guerlain", concentration: "EDP", family: "Oriental Floral", top_notes: ["Bergamot", "Lemon", "Citrus"], mid_notes: ["Rose", "Jasmine", "Iris"], base_notes: ["Vanilla", "Opoponax", "Tonka Bean", "Musk", "Civet"], projection: 8.0, longevity_hrs: 16, is_designer: true },
  { id: "6", name: "Oud Wood", brand: "Tom Ford", year: 2007, perfumer: "Pierre Negrin", concentration: "EDP", family: "Woody Spicy", top_notes: ["Rosewood", "Cardamom", "Chinese pepper"], mid_notes: ["Oud", "Sandalwood", "Vetiver", "Amber"], base_notes: ["Tonka bean", "Vanilla"], projection: 7.0, longevity_hrs: 10, is_designer: true },
];

export default function LibraryPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(PERFUMES[0]);

  const filtered = PERFUMES.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Header title="Perfume Library" subtitle="Reference database of designer, niche & Arabic fragrances" />
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", flex: 1, height: "calc(100vh - 60px)", overflow: "hidden" }}>
        {/* List */}
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.07)", overflowY: "auto", padding: "14px 12px" }}>
          <div style={{ marginBottom: 12, padding: "0 4px" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", pointerEvents: "none" }} />
              <input className="input-base" style={{ paddingLeft: 32 }} placeholder="Search perfumes…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                marginBottom: 5,
                cursor: "pointer",
                background: selected.id === p.id ? "rgba(201,168,76,0.1)" : "transparent",
                border: `1px solid ${selected.id === p.id ? "rgba(201,168,76,0.2)" : "transparent"}`,
                transition: "all 0.1s",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#ffffff" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{p.brand} · {p.year}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{p.family}</div>
                </div>
                <span className={`badge ${p.is_niche ? "badge-purple" : "badge-muted"}`} style={{ fontSize: 9, marginTop: 2 }}>
                  {p.is_niche ? "Niche" : "Designer"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div style={{ overflowY: "auto", padding: 28 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: "#ffffff", marginBottom: 4 }}>{selected.name}</h2>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>{selected.brand} · {selected.year} · {selected.perfumer}</div>
              <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
                <span className="badge badge-gold">{selected.concentration}</span>
                <span className="badge badge-muted">{selected.family}</span>
                <span className={`badge ${selected.is_niche ? "badge-purple" : "badge-blue"}`}>
                  {selected.is_niche ? "Niche" : "Designer"}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-secondary" style={{ height: 34 }}>Clone This</button>
              <button className="btn-primary" style={{ height: 34 }}>
                <BookOpen size={13} /> View Analysis
              </button>
            </div>
          </div>

          {/* Performance */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
            {[
              { label: "Projection", value: `${selected.projection}/10`, icon: BarChart2, color: "#60a5fa" },
              { label: "Longevity", value: `${selected.longevity_hrs}h`, icon: Clock, color: "#22c55e" },
              { label: "Community Score", value: "9.1", icon: Star, color: "#c9a84c" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="glass-card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, border: `1px solid ${s.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={16} style={{ color: s.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "Georgia, serif" }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes pyramid */}
          <div className="glass-card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>Fragrance Notes</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Top Notes", notes: selected.top_notes, color: "#60a5fa" },
                { label: "Heart Notes", notes: selected.mid_notes, color: "#a78bfa" },
                { label: "Base Notes", notes: selected.base_notes, color: "#c9a84c" },
              ].map((layer) => (
                <div key={layer.label}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: layer.color, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{layer.label}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {layer.notes.map((note) => (
                      <span
                        key={note}
                        style={{
                          padding: "4px 12px",
                          background: `${layer.color}12`,
                          border: `1px solid ${layer.color}25`,
                          borderRadius: 99,
                          fontSize: 12,
                          color: "rgba(255,255,255,0.75)",
                        }}
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
