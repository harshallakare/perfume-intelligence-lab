"use client";

import { Header } from "@/components/layout/header";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Search, Star, Clock, BarChart2, Plus, Edit2, Trash2,
  AlertTriangle, X, Check, Loader2, GitBranch, Filter, ChevronDown,
  Sparkles,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PerfumeRef {
  id: string;
  name: string;
  brand: string;
  perfumer?: string;
  year?: number;
  concentration?: string;
  category: string;
  olfactory_family?: string;
  gender_target?: string;
  top_notes: string[];
  middle_notes: string[];
  base_notes: string[];
  projection?: number;
  longevity_hrs?: number;
  season?: string;
  occasion?: string;
  price_tier?: string;
  description?: string;
  community_score?: number;
}

const BLANK = (): Omit<PerfumeRef, "id"> => ({
  name: "", brand: "", perfumer: "", year: undefined,
  concentration: "edp", category: "designer",
  olfactory_family: "", gender_target: "unisex",
  top_notes: [], middle_notes: [], base_notes: [],
  projection: undefined, longevity_hrs: undefined,
  season: "all", occasion: "casual", price_tier: "premium",
  description: "", community_score: undefined,
});

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all",      label: "All"          },
  { id: "designer", label: "Designer"     },
  { id: "niche",    label: "Niche"        },
  { id: "arabic",   label: "Arabic"       },
  { id: "indian",   label: "Indian Attar" },
];

const CATEGORY_COLOR: Record<string, string> = {
  designer: "#60a5fa",
  niche:    "#a78bfa",
  arabic:   "#f59e0b",
  indian:   "#34d399",
};

const PRICE_TIER_LABEL: Record<string, string> = {
  budget: "Budget", mid: "Mid-range", premium: "Premium",
  luxury: "Luxury", ultra: "Ultra-luxury",
};

const CONCENTRATION_LABEL: Record<string, string> = {
  edt: "EDT", edp: "EDP", parfum: "Parfum", extrait: "Extrait de Parfum",
  attar: "Attar", cologne: "Cologne",
};

const FAMILIES = ["all","floral","woody","oriental","fresh","citrus","aquatic","gourmand",
  "chypre","fougere","leather","amber","musk","green","spicy","earthy"];

const GENDERS = ["all", "masculine", "feminine", "unisex"];
const CONCENTRATIONS = ["all", "edt", "edp", "parfum", "extrait", "attar", "cologne"];

// ─── Notes input ─────────────────────────────────────────────────────────────

function NotesInput({ label, value, onChange }: {
  label: string; value: string[]; onChange: (v: string[]) => void;
}) {
  const [raw, setRaw] = useState(value.join(", "));
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
        {label}
      </div>
      <input
        className="input-base"
        placeholder="Rose, Jasmine, Bergamot…"
        value={raw}
        onChange={e => {
          setRaw(e.target.value);
          onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean));
        }}
      />
    </div>
  );
}

// ─── Add / Edit modal ─────────────────────────────────────────────────────────

function PerfumeModal({
  initial, onSave, onClose,
}: {
  initial?: PerfumeRef;
  onSave: (data: Omit<PerfumeRef, "id">) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Omit<PerfumeRef, "id">>(initial ? { ...initial } : BLANK());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.brand.trim()) { setErr("Name and Brand are required."); return; }
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e: any) { setErr(e.message ?? "Failed to save"); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position:"fixed",inset:0,zIndex:1100,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,overflowY:"auto" }}>
      <div className="glass-elevated" style={{ width:"100%",maxWidth:640,maxHeight:"90vh",display:"flex",flexDirection:"column" }}>
        {/* Header */}
        <div style={{ padding:"18px 24px 14px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ fontSize:15,fontWeight:700,color:"#fff" }}>{initial ? "Edit Perfume" : "Add Perfume"}</div>
          <button className="btn-ghost" style={{ padding:"5px 8px" }} onClick={onClose}><X size={15}/></button>
        </div>

        {/* Body */}
        <div style={{ flex:1,overflowY:"auto",padding:"18px 24px",display:"flex",flexDirection:"column",gap:14 }}>
          {err && (
            <div style={{ padding:"8px 12px",borderRadius:7,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",fontSize:12,color:"#fca5a5" }}>
              {err}
            </div>
          )}

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            {[["Name *","name","text"],["Brand *","brand","text"],["Perfumer","perfumer","text"],["Year","year","number"]] .map(([label,key,type]) => (
              <div key={key}>
                <div style={{ fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.5)",marginBottom:4 }}>{label}</div>
                <input className="input-base" type={type} placeholder={label.replace(" *","")}
                  value={(form as any)[key] ?? ""}
                  onChange={e => set(key as any, type==="number" ? (e.target.value ? parseInt(e.target.value) : undefined) : e.target.value)}
                />
              </div>
            ))}
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
            {([ ["Category","category",CATEGORIES.filter(c=>c.id!=="all").map(c=>({v:c.id,l:c.label}))],
                ["Concentration","concentration",CONCENTRATIONS.filter(c=>c!=="all").map(c=>({v:c,l:CONCENTRATION_LABEL[c]??c}))],
                ["Gender","gender_target",GENDERS.filter(g=>g!=="all").map(g=>({v:g,l:g.charAt(0).toUpperCase()+g.slice(1)}))]
              ] as [string,string,{v:string,l:string}[]][]).map(([label,key,opts]) => (
              <div key={key}>
                <div style={{ fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.5)",marginBottom:4 }}>{label}</div>
                <select className="select-base" value={(form as any)[key]??""} onChange={e=>set(key as any,e.target.value)}>
                  {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12 }}>
            {([ ["Family","olfactory_family",FAMILIES.filter(f=>f!=="all").map(f=>({v:f,l:f.charAt(0).toUpperCase()+f.slice(1)}))],
                ["Season","season",[{v:"spring",l:"Spring"},{v:"summer",l:"Summer"},{v:"fall",l:"Fall"},{v:"winter",l:"Winter"},{v:"all",l:"All Season"}]],
                ["Price Tier","price_tier",[{v:"budget",l:"Budget"},{v:"mid",l:"Mid"},{v:"premium",l:"Premium"},{v:"luxury",l:"Luxury"},{v:"ultra",l:"Ultra-luxury"}]]
              ] as [string,string,{v:string,l:string}[]][]).map(([label,key,opts]) => (
              <div key={key}>
                <div style={{ fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.5)",marginBottom:4 }}>{label}</div>
                <select className="select-base" value={(form as any)[key]??""} onChange={e=>set(key as any,e.target.value)}>
                  {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12 }}>
            {[["Projection (1-10)","projection"],["Longevity (hours)","longevity_hrs"],["Community Score (0-10)","community_score"]].map(([label,key]) => (
              <div key={key}>
                <div style={{ fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.5)",marginBottom:4 }}>{label}</div>
                <input className="input-base" type="number" step="0.1" min="0" max="10"
                  value={(form as any)[key]??""} onChange={e=>set(key as any,e.target.value?parseFloat(e.target.value):undefined)}/>
              </div>
            ))}
          </div>

          <NotesInput label="Top Notes"    value={form.top_notes}    onChange={v=>set("top_notes",v)}/>
          <NotesInput label="Heart Notes"  value={form.middle_notes} onChange={v=>set("middle_notes",v)}/>
          <NotesInput label="Base Notes"   value={form.base_notes}   onChange={v=>set("base_notes",v)}/>

          <div>
            <div style={{ fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.5)",marginBottom:4 }}>Description</div>
            <textarea className="input-base" rows={3} value={form.description??""} onChange={e=>set("description",e.target.value)} style={{ resize:"vertical" }}/>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 24px",borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",gap:10,justifyContent:"flex-end" }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={13} style={{ animation:"spin 1s linear infinite" }}/> : <Check size={13}/>}
            {initial ? "Save Changes" : "Add Perfume"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete dialog ────────────────────────────────────────────────────────────

function DeleteDialog({ name, onConfirm, onClose, loading, error }: {
  name: string; onConfirm: () => void; onClose: () => void; loading: boolean; error: string;
}) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:1200,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
      <div className="glass-elevated" style={{ width:"100%",maxWidth:420 }}>
        <div style={{ padding:"18px 24px 14px",borderBottom:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:12 }}>
          <div style={{ width:34,height:34,borderRadius:8,background:"rgba(239,68,68,0.12)",border:"1px solid rgba(239,68,68,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <Trash2 size={15} color="#ef4444"/>
          </div>
          <div>
            <div style={{ fontSize:14,fontWeight:700,color:"#fff" }}>Delete Perfume</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)" }}>Cannot be undone</div>
          </div>
        </div>
        <div style={{ padding:"16px 24px" }}>
          <p style={{ fontSize:13,color:"rgba(255,255,255,0.65)",lineHeight:1.6,margin:0 }}>
            Delete <span style={{ color:"#fff",fontWeight:600 }}>{name}</span> from the reference library?
          </p>
          {error && (
            <div style={{ marginTop:12,padding:"8px 12px",borderRadius:7,background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.3)",display:"flex",gap:8,alignItems:"center" }}>
              <AlertTriangle size={13} color="#ef4444"/>
              <span style={{ fontSize:12,color:"#fca5a5" }}>{error}</span>
            </div>
          )}
        </div>
        <div style={{ padding:"0 24px 18px",display:"flex",gap:10,justifyContent:"flex-end" }}>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-primary" style={{ background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.4)",color:"#ef4444" }} onClick={onConfirm} disabled={loading}>
            <Trash2 size={13}/>{loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const router = useRouter();

  const [perfumes, setPerfumes] = useState<PerfumeRef[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<PerfumeRef | null>(null);

  // filters
  const [category,  setCategory]  = useState("all");
  const [search,    setSearch]    = useState("");
  const [family,    setFamily]    = useState("all");
  const [gender,    setGender]    = useState("all");
  const [conc,      setConc]      = useState("all");
  const [sortBy,    setSortBy]    = useState<"name"|"year"|"score"|"projection"|"longevity">("name");
  const [showFilters, setShowFilters] = useState(false);

  // modals
  const [addOpen,       setAddOpen]       = useState(false);
  const [editTarget,    setEditTarget]    = useState<PerfumeRef | null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<PerfumeRef | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/library")
      .then(r => r.json())
      .then(data => { setPerfumes(Array.isArray(data) ? data : []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // set default selected once loaded
  useEffect(() => {
    if (!selected && perfumes.length > 0) setSelected(perfumes[0]);
  }, [perfumes]);

  const filtered = useMemo(() => {
    let list = perfumes;
    if (category !== "all") list = list.filter(p => p.category === category);
    if (family   !== "all") list = list.filter(p => p.olfactory_family === family);
    if (gender   !== "all") list = list.filter(p => p.gender_target === gender);
    if (conc     !== "all") list = list.filter(p => p.concentration === conc);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || (p.perfumer ?? "").toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortBy === "name")       return a.name.localeCompare(b.name);
      if (sortBy === "year")       return (b.year ?? 0) - (a.year ?? 0);
      if (sortBy === "score")      return (b.community_score ?? 0) - (a.community_score ?? 0);
      if (sortBy === "projection") return (b.projection ?? 0) - (a.projection ?? 0);
      if (sortBy === "longevity")  return (b.longevity_hrs ?? 0) - (a.longevity_hrs ?? 0);
      return 0;
    });
  }, [perfumes, category, family, gender, conc, search, sortBy]);

  const counts = useMemo(() => CATEGORIES.reduce((acc, c) => ({
    ...acc,
    [c.id]: c.id === "all" ? perfumes.length : perfumes.filter(p => p.category === c.id).length,
  }), {} as Record<string, number>), [perfumes]);

  const handleAdd = async (data: Omit<PerfumeRef, "id">) => {
    const res = await fetch("/api/library", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("Failed to add");
    const created: PerfumeRef = await res.json();
    setPerfumes(ps => [...ps, created]);
    setSelected(created);
  };

  const handleEdit = async (data: Omit<PerfumeRef, "id">) => {
    const res = await fetch(`/api/library/${editTarget!.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("Failed to update");
    const updated: PerfumeRef = await res.json();
    setPerfumes(ps => ps.map(p => p.id === updated.id ? updated : p));
    setSelected(updated);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true); setDeleteError("");
    try {
      const res = await fetch(`/api/library/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setPerfumes(ps => ps.filter(p => p.id !== deleteTarget.id));
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
    } catch (e: any) {
      setDeleteError(e.message ?? "Failed to delete");
    } finally {
      setDeleteLoading(false);
    }
  };

  const cloneToFormula = (p: PerfumeRef) => {
    const params = new URLSearchParams({
      clone_name:   p.name,
      clone_family: p.olfactory_family ?? "",
      clone_conc:   p.concentration ?? "edp",
    });
    router.push(`/formulas/new?${params.toString()}`);
  };

  if (loading) {
    return (
      <>
        <Header title="Perfume Library" subtitle="Reference database of designer, niche & Arabic fragrances" />
        <div style={{ display:"flex",alignItems:"center",justifyContent:"center",flex:1,height:400,gap:10,color:"rgba(255,255,255,0.4)" }}>
          <Loader2 size={20} style={{ animation:"spin 1s linear infinite" }}/>
          <span>Loading library…</span>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </>
    );
  }

  return (
    <>
      <Header title="Perfume Library" subtitle={`${perfumes.length} reference fragrances — designer, niche, Arabic & Indian attar`} />

      {/* Category tabs + actions */}
      <div style={{ padding:"0 24px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:4,flexWrap:"wrap" }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setCategory(c.id)} style={{
            padding:"10px 16px",border:"none",cursor:"pointer",background:"transparent",
            color: category===c.id ? "#c9a84c" : "rgba(255,255,255,0.45)",
            fontWeight: category===c.id ? 700 : 400,
            fontSize: 13,
            borderBottom: category===c.id ? "2px solid #c9a84c" : "2px solid transparent",
            transition:"all 0.15s",
            display:"flex",alignItems:"center",gap:6,
          }}>
            {c.label}
            <span style={{ fontSize:10,padding:"1px 6px",borderRadius:99,background:category===c.id?"rgba(201,168,76,0.15)":"rgba(255,255,255,0.06)",color:category===c.id?"#c9a84c":"rgba(255,255,255,0.3)" }}>
              {counts[c.id] ?? 0}
            </span>
          </button>
        ))}
        <div style={{ flex:1 }}/>
        <button className="btn-primary" style={{ height:32,fontSize:12,margin:"8px 0" }} onClick={() => setAddOpen(true)}>
          <Plus size={12}/> Add Perfume
        </button>
      </div>

      {/* Filter / search bar */}
      <div style={{ padding:"10px 24px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
        <div style={{ position:"relative",width:240 }}>
          <Search size={13} style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"rgba(255,255,255,0.35)",pointerEvents:"none" }}/>
          <input className="input-base" style={{ paddingLeft:32,height:34 }} placeholder="Search name, brand, perfumer…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="select-base" style={{ height:34,width:140 }} value={family} onChange={e=>setFamily(e.target.value)}>
          {FAMILIES.map(f=><option key={f} value={f}>{f==="all"?"All Families":f.charAt(0).toUpperCase()+f.slice(1)}</option>)}
        </select>
        <select className="select-base" style={{ height:34,width:130 }} value={gender} onChange={e=>setGender(e.target.value)}>
          {GENDERS.map(g=><option key={g} value={g}>{g==="all"?"All Genders":g.charAt(0).toUpperCase()+g.slice(1)}</option>)}
        </select>
        <select className="select-base" style={{ height:34,width:120 }} value={conc} onChange={e=>setConc(e.target.value)}>
          {CONCENTRATIONS.map(c=><option key={c} value={c}>{c==="all"?"All Types":(CONCENTRATION_LABEL[c]??c)}</option>)}
        </select>
        <div style={{ flex:1 }}/>
        <div style={{ display:"flex",alignItems:"center",gap:6 }}>
          <span style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>Sort:</span>
          <select className="select-base" style={{ height:34,width:130 }} value={sortBy} onChange={e=>setSortBy(e.target.value as any)}>
            <option value="name">Name</option>
            <option value="year">Newest First</option>
            <option value="score">Top Rated</option>
            <option value="projection">Projection</option>
            <option value="longevity">Longevity</option>
          </select>
        </div>
        <span style={{ fontSize:12,color:"rgba(255,255,255,0.3)" }}>{filtered.length} results</span>
      </div>

      {/* Main body */}
      <div style={{ display:"grid",gridTemplateColumns:"300px 1fr",flex:1,height:"calc(100vh - 195px)",overflow:"hidden" }}>

        {/* ── Left: list ── */}
        <div style={{ borderRight:"1px solid rgba(255,255,255,0.07)",overflowY:"auto",padding:"10px 8px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:"center",padding:"40px 16px",color:"rgba(255,255,255,0.3)",fontSize:13 }}>No perfumes match your filters</div>
          ) : (
            filtered.map(p => {
              const catColor = CATEGORY_COLOR[p.category] ?? "#94a3b8";
              const isActive = selected?.id === p.id;
              return (
                <div key={p.id} onClick={() => setSelected(p)} style={{
                  padding:"10px 12px",borderRadius:8,marginBottom:4,cursor:"pointer",
                  background: isActive ? "rgba(201,168,76,0.09)" : "transparent",
                  border: `1px solid ${isActive ? "rgba(201,168,76,0.22)" : "transparent"}`,
                  transition:"all 0.1s",
                }}>
                  <div style={{ display:"flex",alignItems:"flex-start",gap:8 }}>
                    <div style={{ width:3,height:36,borderRadius:99,background:catColor,flexShrink:0,marginTop:2 }}/>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ fontSize:13,fontWeight:600,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{p.name}</div>
                      <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:1 }}>{p.brand}{p.year ? ` · ${p.year}` : ""}</div>
                      <div style={{ display:"flex",gap:5,marginTop:4,flexWrap:"wrap" }}>
                        {p.concentration && <span style={{ fontSize:9,padding:"1px 6px",borderRadius:99,background:`${catColor}18`,border:`1px solid ${catColor}30`,color:catColor,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em" }}>{CONCENTRATION_LABEL[p.concentration]??p.concentration}</span>}
                        {p.olfactory_family && <span style={{ fontSize:9,padding:"1px 6px",borderRadius:99,background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.45)",textTransform:"capitalize" }}>{p.olfactory_family}</span>}
                      </div>
                    </div>
                    {p.community_score && (
                      <div style={{ display:"flex",alignItems:"center",gap:3,flexShrink:0 }}>
                        <Star size={10} style={{ color:"#c9a84c" }} fill="#c9a84c"/>
                        <span style={{ fontSize:11,fontWeight:700,color:"#c9a84c" }}>{p.community_score.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Right: detail ── */}
        {selected ? (
          <div style={{ overflowY:"auto",padding:"24px 28px" }}>
            {/* Header */}
            <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:22,gap:16 }}>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:6 }}>
                  <h2 style={{ fontFamily:"Georgia,serif",fontSize:24,fontWeight:700,color:"#fff",margin:0 }}>{selected.name}</h2>
                  {selected.concentration && (
                    <span style={{ fontSize:11,padding:"2px 9px",borderRadius:99,background:"rgba(201,168,76,0.15)",color:"#c9a84c",border:"1px solid rgba(201,168,76,0.3)",fontWeight:700 }}>
                      {CONCENTRATION_LABEL[selected.concentration]??selected.concentration}
                    </span>
                  )}
                  <span style={{ fontSize:11,padding:"2px 9px",borderRadius:99,background:`${CATEGORY_COLOR[selected.category]??'#94a3b8'}18`,color:CATEGORY_COLOR[selected.category]??"#94a3b8",border:`1px solid ${CATEGORY_COLOR[selected.category]??'#94a3b8'}30`,fontWeight:600 }}>
                    {CATEGORIES.find(c=>c.id===selected.category)?.label}
                  </span>
                </div>
                <div style={{ fontSize:13,color:"rgba(255,255,255,0.5)",marginBottom:4 }}>
                  {selected.brand}{selected.perfumer ? ` · ${selected.perfumer}` : ""}{selected.year ? ` · ${selected.year}` : ""}
                </div>
                {selected.description && (
                  <p style={{ fontSize:13,color:"rgba(255,255,255,0.55)",lineHeight:1.65,margin:0,maxWidth:600 }}>{selected.description}</p>
                )}
              </div>
              <div style={{ display:"flex",gap:7,flexShrink:0 }}>
                <button className="btn-primary" style={{ height:34,fontSize:12 }} onClick={() => cloneToFormula(selected)}>
                  <Sparkles size={12}/> Clone to Formula
                </button>
                <button className="btn-ghost" style={{ height:34,padding:"0 10px" }} title="Edit" onClick={() => setEditTarget(selected)}>
                  <Edit2 size={13}/>
                </button>
                <button className="btn-ghost" style={{ height:34,padding:"0 10px",color:"rgba(239,68,68,0.6)" }} title="Delete" onClick={() => { setDeleteTarget(selected); setDeleteError(""); }}>
                  <Trash2 size={13}/>
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:22 }}>
              {[
                { label:"Projection",    value: selected.projection  ? `${selected.projection}/10`  : "—", icon:BarChart2, color:"#60a5fa" },
                { label:"Longevity",     value: selected.longevity_hrs ? `${selected.longevity_hrs}h` : "—", icon:Clock,     color:"#22c55e" },
                { label:"Community",     value: selected.community_score ? `${selected.community_score.toFixed(1)}` : "—", icon:Star, color:"#c9a84c" },
                { label:"Price Tier",    value: PRICE_TIER_LABEL[selected.price_tier??""] ?? "—",    icon:GitBranch, color:"#a78bfa" },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="glass-card" style={{ padding:"12px 16px",display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ width:32,height:32,borderRadius:8,background:`${s.color}18`,border:`1px solid ${s.color}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      <Icon size={14} style={{ color:s.color }}/>
                    </div>
                    <div>
                      <div style={{ fontSize:18,fontWeight:700,color:s.color,fontFamily:"Georgia,serif" }}>{s.value}</div>
                      <div style={{ fontSize:10,color:"rgba(255,255,255,0.4)" }}>{s.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notes pyramid */}
            <div className="glass-card" style={{ padding:20,marginBottom:16 }}>
              <div style={{ fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.6)",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:16 }}>Fragrance Pyramid</div>
              <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
                {[
                  { label:"Top Notes",   notes: selected.top_notes,    color:"#60a5fa", empty:"No top notes recorded" },
                  { label:"Heart Notes", notes: selected.middle_notes,  color:"#a78bfa", empty:"No heart notes recorded" },
                  { label:"Base Notes",  notes: selected.base_notes,   color:"#c9a84c", empty:"No base notes recorded" },
                ].map(layer => (
                  <div key={layer.label}>
                    <div style={{ fontSize:10,fontWeight:700,color:layer.color,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:8 }}>
                      {layer.label}
                    </div>
                    {layer.notes.length === 0 ? (
                      <span style={{ fontSize:12,color:"rgba(255,255,255,0.2)",fontStyle:"italic" }}>{layer.empty}</span>
                    ) : (
                      <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                        {layer.notes.map(note => (
                          <span key={note} style={{ padding:"4px 12px",background:`${layer.color}10`,border:`1px solid ${layer.color}25`,borderRadius:99,fontSize:12,color:"rgba(255,255,255,0.75)" }}>
                            {note}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Meta details */}
            <div className="glass-card" style={{ padding:16 }}>
              <div style={{ fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.4)",letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:12 }}>Details</div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 20px" }}>
                {[
                  ["Olfactory Family", selected.olfactory_family],
                  ["Gender Target",    selected.gender_target],
                  ["Season",          selected.season],
                  ["Occasion",        selected.occasion],
                  ["Price Tier",      PRICE_TIER_LABEL[selected.price_tier??""]],
                ].map(([label, value]) => value && (
                  <div key={label} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <span style={{ fontSize:12,color:"rgba(255,255,255,0.4)" }}>{label}</span>
                    <span style={{ fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.75)",textTransform:"capitalize" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.25)",fontSize:13 }}>
            Select a perfume to view details
          </div>
        )}
      </div>

      {/* Modals */}
      {addOpen && <PerfumeModal onSave={handleAdd} onClose={() => setAddOpen(false)} />}
      {editTarget && <PerfumeModal initial={editTarget} onSave={handleEdit} onClose={() => setEditTarget(null)} />}
      {deleteTarget && (
        <DeleteDialog
          name={deleteTarget.name}
          onConfirm={handleDelete}
          onClose={() => { setDeleteTarget(null); setDeleteError(""); }}
          loading={deleteLoading}
          error={deleteError}
        />
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
