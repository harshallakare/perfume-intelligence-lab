"use client";

import { useState, useMemo } from "react";
import {
  Search, Filter, Leaf, Zap, AlertTriangle, ChevronRight, X,
  FlaskConical, Atom, Droplets, Clock, TrendingUp, Info,
  ChevronDown, BarChart3,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════
   DATA — Molecule reference library
   ═══════════════════════════════════════════════════════════════════════ */
type VolClass = "T" | "M" | "B";
type ChemFamily =
  | "terpene" | "ester" | "aldehyde" | "ketone" | "musk" | "lactone"
  | "phenol" | "alcohol" | "oxide" | "nitrile" | "macro_cyclic" | "polycyclic" | "other";

interface Molecule {
  id: string;
  name: string;
  cas: string;
  odorFamily: string;
  chemFamily: ChemFamily;
  volatility: VolClass;
  intensity: number;        // 1-10
  threshold: number;        // ppb — how little you need to smell it
  substantivity: number;    // hours on skin
  isNatural: boolean;
  isAllergen: boolean;
  isIfra: boolean;
  odorDescriptors: string[];
  blendsWith: string[];     // ids
  notes: string;
  boilingPoint: number;     // °C
}

const MOLECULES: Molecule[] = [
  { id:"iso_e",    name:"ISO E Super",             cas:"54464-57-2",  odorFamily:"woody",    chemFamily:"other",       volatility:"M", intensity:8,  threshold:0.001, substantivity:6,  isNatural:false, isAllergen:false, isIfra:false, odorDescriptors:["woody","cedar","velvet","diffusive","skin"],         blendsWith:["ambroxan","linalool","rose","hedione"],          notes:"Unique cedarwood material with extraordinary diffusivity. Amplifies other ingredients.", boilingPoint:278  },
  { id:"ambroxan", name:"Ambroxan",                cas:"3238-14-4",   odorFamily:"amber",    chemFamily:"other",       volatility:"B", intensity:7,  threshold:0.0003, substantivity:24, isNatural:false, isAllergen:false, isIfra:false, odorDescriptors:["amber","woody","animalic","musky","clean"],         blendsWith:["iso_e","vetiver","oud","rose","iris"],           notes:"Semi-synthetic from ambreine. Powerfully fixative with skin-enhancing properties.", boilingPoint:305  },
  { id:"rose",     name:"Rose Absolute (Bulgaria)",cas:"8007-01-0",   odorFamily:"floral",   chemFamily:"alcohol",     volatility:"M", intensity:9,  threshold:0.01,   substantivity:4,  isNatural:true,  isAllergen:true,  isIfra:true,  odorDescriptors:["rose","honey","waxy","jammy","green stem"],         blendsWith:["iso_e","hedione","linalool","ambroxan","iris"],  notes:"The queen of florals. Rich in geraniol, citronellol and rose oxide.", boilingPoint:229  },
  { id:"hedione",  name:"Hedione HC",              cas:"24851-98-7",  odorFamily:"floral",   chemFamily:"ester",       volatility:"M", intensity:4,  threshold:0.1,    substantivity:5,  isNatural:false, isAllergen:false, isIfra:false, odorDescriptors:["jasmine","green","watery","diffusive","luminous"],  blendsWith:["rose","linalool","iso_e","muguet"],              notes:"High-cis isomer. Far more powerful than standard Hedione. Activates pheromone receptors.", boilingPoint:257  },
  { id:"vetiver",  name:"Vetiver Essential Oil",   cas:"8016-96-4",   odorFamily:"woody",    chemFamily:"other",       volatility:"B", intensity:7,  threshold:0.5,    substantivity:12, isNatural:true,  isAllergen:false, isIfra:false, odorDescriptors:["woody","earthy","smoky","dry","rooty","dark"],      blendsWith:["ambroxan","iso_e","oud","patchouli"],            notes:"Complex steam-distilled oil from Chrysopogon zizanioides roots. Exceptional tenacity.", boilingPoint:290  },
  { id:"dhm",      name:"Dihydromyrcenol",         cas:"18479-58-8",  odorFamily:"fresh",    chemFamily:"alcohol",     volatility:"T", intensity:8,  threshold:2.0,    substantivity:2,  isNatural:false, isAllergen:false, isIfra:false, odorDescriptors:["fresh","citrus","lime","green","aquatic","clean"],  blendsWith:["linalool","hedione","muguet","bergamot"],        notes:"Workhorse fresh-citrus alcohol. Dominant in all major fresh fougères.", boilingPoint:222  },
  { id:"iris",     name:"Iris Butter",             cas:"90028-63-0",  odorFamily:"powdery",  chemFamily:"ketone",      volatility:"M", intensity:8,  threshold:0.001,  substantivity:8,  isNatural:true,  isAllergen:false, isIfra:false, odorDescriptors:["iris","violet","carrot","powdery","cold","lipstick"],blendsWith:["rose","ambroxan","iso_e","musk_e"],              notes:"Irones from aged iris rhizomes. One of the most precious naturals in perfumery.", boilingPoint:235  },
  { id:"musk_e",   name:"Ethylene Brassylate",     cas:"105-95-3",    odorFamily:"musk",     chemFamily:"macro_cyclic",volatility:"B", intensity:6,  threshold:0.001,  substantivity:48, isNatural:false, isAllergen:false, isIfra:false, odorDescriptors:["musk","clean","warm","slightly sweet","powdery"],   blendsWith:["iso_e","ambroxan","iris","rose"],                notes:"Macro-cyclic musk with superior fixation. IFRA-exempt. Skin-safe biodegradable.", boilingPoint:340  },
  { id:"linalool", name:"Linalool (Synthetic)",    cas:"78-70-6",     odorFamily:"floral",   chemFamily:"alcohol",     volatility:"T", intensity:6,  threshold:0.8,    substantivity:2,  isNatural:false, isAllergen:true,  isIfra:true,  odorDescriptors:["floral","lavender","citrusy","sweet","clean"],      blendsWith:["dhm","hedione","rose","geraniol"],               notes:"Most abundant fragrance ingredient by volume. Regulatory allergen; must be declared >0.01%.", boilingPoint:198  },
  { id:"oud",      name:"Oud Absolute (Bangladesh)",cas:"",           odorFamily:"woody",    chemFamily:"other",       volatility:"B", intensity:10, threshold:0.0001, substantivity:36, isNatural:true,  isAllergen:false, isIfra:false, odorDescriptors:["oud","animalic","leathery","smoke","medicinal","dark"],blendsWith:["ambroxan","rose","vetiver","musk_e"],            notes:"Agarwood absolute. Highest odor intensity of any natural material. Extremely limited supply.", boilingPoint:320  },
  { id:"geraniol", name:"Geraniol",                cas:"106-24-1",    odorFamily:"floral",   chemFamily:"alcohol",     volatility:"T", intensity:6,  threshold:1.0,    substantivity:3,  isNatural:false, isAllergen:true,  isIfra:true,  odorDescriptors:["rose","geranium","citrus","green","sweet"],         blendsWith:["rose","linalool","citronellol","hedione"],       notes:"Main component of geranium oil. Declared allergen. Powerful anti-microbial activity.", boilingPoint:229  },
  { id:"bergamot", name:"Bergamot EO (bergapten-free)", cas:"68648-33-9", odorFamily:"citrus", chemFamily:"terpene", volatility:"T", intensity:7,  threshold:0.4,    substantivity:1,  isNatural:true,  isAllergen:true,  isIfra:true,  odorDescriptors:["citrus","bergamot","green","floral","fresh","sour"],blendsWith:["dhm","linalool","hedione","neroli"],              notes:"Bergapten-free required for leave-on products. Highest quality from Calabria.", boilingPoint:176  },
  { id:"patchouli",name:"Patchouli EO (dark)",     cas:"8014-09-3",   odorFamily:"oriental", chemFamily:"other",       volatility:"B", intensity:9,  threshold:0.01,   substantivity:20, isNatural:true,  isAllergen:false, isIfra:false, odorDescriptors:["earthy","dark","sweet","smoky","incense","rich"],   blendsWith:["oud","vetiver","rose","musk_e"],                 notes:"Gets better with age. Aged patchouli commands 3-5× premium. Core oriental base.", boilingPoint:285  },
  { id:"coumarin", name:"Coumarin",                cas:"91-64-5",     odorFamily:"gourmand", chemFamily:"lactone",     volatility:"B", intensity:7,  threshold:3.0,    substantivity:10, isNatural:false, isAllergen:false, isIfra:true,  odorDescriptors:["hay","sweet","tonka","tobacco","almond","warm"],    blendsWith:["linalool","vetiver","musk_e","patchouli"],       notes:"Fougère anchor. IFRA restricted to 1.8% in leave-on products. Tonka bean character.", boilingPoint:301  },
  { id:"galaxolide",name:"Galaxolide 50 IPM",      cas:"1222-05-5",   odorFamily:"musk",     chemFamily:"polycyclic",  volatility:"B", intensity:5,  threshold:0.01,   substantivity:36, isNatural:false, isAllergen:false, isIfra:true,  odorDescriptors:["musk","clean","slightly sweet","powdery","laundry"],blendsWith:["musk_e","ambroxan","dhm","linalool"],            notes:"Most widely used synthetic musk. Under increasing regulatory scrutiny in EU.", boilingPoint:330  },
  { id:"neroli",   name:"Neroli EO",               cas:"8016-38-4",   odorFamily:"floral",   chemFamily:"terpene",     volatility:"T", intensity:8,  threshold:0.05,   substantivity:3,  isNatural:true,  isAllergen:true,  isIfra:true,  odorDescriptors:["orange blossom","white floral","green","fresh","powdery"],blendsWith:["bergamot","rose","linalool","hedione"],        notes:"From Citrus aurantium flowers. Extremely expensive. Linalool 30–35%, linalyl acetate 5–15%.", boilingPoint:199  },
  { id:"oakmoss",  name:"Oakmoss Abs. (dilution)", cas:"90028-67-4",  odorFamily:"chypre",   chemFamily:"other",       volatility:"B", intensity:8,  threshold:0.002,  substantivity:24, isNatural:true,  isAllergen:true,  isIfra:true,  odorDescriptors:["forest","earthy","damp","bark","marine","primitive"],blendsWith:["bergamot","patchouli","rose","vetiver"],         notes:"Heavily restricted IFRA sensitiser. Usually replaced by Evernyl derivatives.", boilingPoint:290  },
  { id:"limonene", name:"D-Limonene",              cas:"5989-27-5",   odorFamily:"citrus",   chemFamily:"terpene",     volatility:"T", intensity:5,  threshold:200,    substantivity:0.5,isNatural:false, isAllergen:true,  isIfra:true,  odorDescriptors:["orange","citrus","clean","bright","zesty"],         blendsWith:["bergamot","linalool","dhm","neroli"],            notes:"Most abundant citrus monoterpene. Weak tenacity but essential for citrus authenticity.", boilingPoint:176  },
  { id:"salicylate",name:"Benzyl Salicylate",      cas:"118-58-1",    odorFamily:"floral",   chemFamily:"ester",       volatility:"B", intensity:4,  threshold:1000,   substantivity:8,  isNatural:false, isAllergen:true,  isIfra:true,  odorDescriptors:["floral","sweet","slightly balsamic","powdery"],     blendsWith:["rose","jasmine","neroli","musk_e"],              notes:"Classic floral fixative. UV-absorber. Declared allergen since IFRA amendment 48.", boilingPoint:320  },
  { id:"muscone",  name:"Muscone (synthetic)",     cas:"541-91-3",    odorFamily:"musk",     chemFamily:"macro_cyclic",volatility:"B", intensity:9,  threshold:0.00008,substantivity:72, isNatural:false, isAllergen:false, isIfra:false, odorDescriptors:["animalic musk","warm","fatty","rich","sensual"],    blendsWith:["ambroxan","oud","rose","musk_e"],                notes:"The reference animalic musk. 15-membered ring. Extremely potent — use at 0.1–0.5%.", boilingPoint:328  },
];

/* Synergy data: pairs + score + note */
interface SynergyPair {
  a: string; b: string; score: number;  // 1-5
  effect: string;
}
const SYNERGIES: SynergyPair[] = [
  { a:"iso_e",   b:"ambroxan",   score:5, effect:"Amplified woody-amber with extraordinary skin projection" },
  { a:"iso_e",   b:"rose",       score:4, effect:"Velvety cedarwood lifts and rounds the rosy floralcy" },
  { a:"rose",    b:"hedione",    score:5, effect:"Classic Chanel №5 effect — jasminey luminous floral explosion" },
  { a:"rose",    b:"linalool",   score:4, effect:"Lavender-rose softness with clean soapy undertone" },
  { a:"ambroxan",b:"oud",        score:5, effect:"Dark animalic amber, extraordinary depth and animalic resonance" },
  { a:"ambroxan",b:"vetiver",    score:4, effect:"Dry woody-earthy base, excellent masculine structure" },
  { a:"vetiver", b:"patchouli",  score:4, effect:"Deep damp earth, classic oriental-woody base accord" },
  { a:"dhm",     b:"linalool",   score:5, effect:"Archetypal fresh fougère opening — cool, clean, aquatic" },
  { a:"dhm",     b:"bergamot",   score:4, effect:"Soapy fresh-citrus with excellent aerial diffusion" },
  { a:"iris",    b:"ambroxan",   score:5, effect:"Cold powdery amber — iconic Dior-esque signature" },
  { a:"iris",    b:"rose",       score:4, effect:"Sophisticated powdery floral, slightly lipstick-like" },
  { a:"musk_e",  b:"ambroxan",   score:4, effect:"Clean skin musk base — smooth and long-lasting" },
  { a:"musk_e",  b:"iso_e",      score:4, effect:"Warm woody skin musk with velvety diffusion" },
  { a:"oud",     b:"rose",       score:5, effect:"Oud-e-rose — the most commercially successful Arab accord" },
  { a:"oud",     b:"patchouli",  score:4, effect:"Dark smoky oriental, heavy and resinous base" },
  { a:"coumarin",b:"linalool",   score:5, effect:"Classic fougère — lavender-hay, the original barbershop chord" },
  { a:"bergamot",b:"neroli",     score:5, effect:"Bright hesperidic-floral citrus — Eau de Cologne cornerstone" },
  { a:"patchouli",b:"musk_e",   score:3, effect:"Earthy sweetness moderated into a soft durable base" },
  { a:"oakmoss", b:"bergamot",   score:5, effect:"The chypre accord — fresh green citrus over dark forest floor" },
  { a:"linalool",b:"coumarin",   score:5, effect:"Lavender-tonka: the modern clean-fougère archetype" },
];

/* Volatility curve data — relative intensity (0-100) at hours 0, 0.5, 1, 2, 3, 5, 8 */
const TIME_POINTS = [0, 0.5, 1, 2, 3, 5, 8];
interface VolCurve { id: string; name: string; color: string; curve: number[] }
const VOL_CURVES: VolCurve[] = [
  { id:"dhm",      name:"Dihydromyrcenol",       color:"#60a5fa", curve:[100, 85, 65, 35, 15, 3,  0 ] },
  { id:"linalool", name:"Linalool",              color:"#a78bfa", curve:[100, 80, 55, 25, 10, 2,  0 ] },
  { id:"bergamot", name:"Bergamot EO",           color:"#fde047", curve:[95,  75, 50, 20, 8,  1,  0 ] },
  { id:"neroli",   name:"Neroli EO",             color:"#fb923c", curve:[90,  78, 60, 30, 15, 4,  1 ] },
  { id:"rose",     name:"Rose Absolute",         color:"#f472b6", curve:[70,  80, 85, 75, 55, 30, 10] },
  { id:"hedione",  name:"Hedione HC",            color:"#e879f9", curve:[60,  70, 80, 75, 60, 35, 12] },
  { id:"iso_e",    name:"ISO E Super",           color:"#34d399", curve:[50,  60, 70, 80, 80, 65, 40] },
  { id:"iris",     name:"Iris Butter",           color:"#c4b5fd", curve:[40,  50, 65, 75, 72, 55, 30] },
  { id:"ambroxan", name:"Ambroxan",              color:"#c9a84c", curve:[30,  35, 45, 65, 78, 85, 80] },
  { id:"vetiver",  name:"Vetiver EO",            color:"#86efac", curve:[25,  30, 40, 60, 72, 80, 75] },
  { id:"musk_e",   name:"Ethylene Brassylate",   color:"#f9a8d4", curve:[15,  20, 30, 50, 68, 82, 90] },
  { id:"oud",      name:"Oud Absolute",          color:"#d97706", curve:[35,  40, 50, 65, 78, 88, 85] },
];

/* Odor wheel segments (angle + color per family) */
const WHEEL_SEGMENTS = [
  { family:"floral",   color:"#f472b6", molecules:["rose","hedione","linalool","neroli","salicylate","geraniol"] },
  { family:"citrus",   color:"#fde047", molecules:["bergamot","limonene"] },
  { family:"woody",    color:"#a78bfa", molecules:["iso_e","vetiver","oud"] },
  { family:"fresh",    color:"#60a5fa", molecules:["dhm"] },
  { family:"amber",    color:"#c9a84c", molecules:["ambroxan"] },
  { family:"oriental", color:"#f97316", molecules:["patchouli"] },
  { family:"musk",     color:"#f9a8d4", molecules:["musk_e","galaxolide","muscone"] },
  { family:"powdery",  color:"#c4b5fd", molecules:["iris","coumarin"] },
  { family:"chypre",   color:"#86efac", molecules:["oakmoss"] },
  { family:"gourmand", color:"#fbbf24", molecules:["coumarin"] },
];

/* ═══════════════════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════════════════ */
const CHEM_COLORS: Record<ChemFamily, string> = {
  terpene:"#fde047", ester:"#86efac", aldehyde:"#fb923c", ketone:"#c4b5fd",
  musk:"#f9a8d4", lactone:"#fbbf24", phenol:"#f87171", alcohol:"#60a5fa",
  oxide:"#34d399", nitrile:"#a78bfa", macro_cyclic:"#c9a84c", polycyclic:"#e879f9", other:"rgba(255,255,255,0.3)",
};

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 10, padding: "2px 7px", borderRadius: 99, fontWeight: 600,
      background: color + "18", border: `1px solid ${color}44`, color,
    }}>{label}</span>
  );
}

function IntensityBar({ value, max = 10 }: { value: number; max?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 99 }}>
        <div style={{
          height: "100%", borderRadius: 99,
          width: `${(value / max) * 100}%`,
          background: value >= 8 ? "#ef4444" : value >= 6 ? "#c9a84c" : "#60a5fa",
        }} />
      </div>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", width: 16, textAlign: "right" }}>{value}</span>
    </div>
  );
}

const volLabel = (v: VolClass) => v === "T" ? "Top" : v === "M" ? "Mid" : "Base";
const volColor = (v: VolClass) => v === "T" ? "#60a5fa" : v === "M" ? "#a78bfa" : "#c9a84c";

/* ═══════════════════════════════════════════════════════════════════════
   TAB 1: Molecule Library
   ═══════════════════════════════════════════════════════════════════════ */
function MoleculeLibrary() {
  const [search,    setSearch]    = useState("");
  const [volFilter, setVolFilter] = useState<"All"|VolClass>("All");
  const [famFilter, setFamFilter] = useState("All");
  const [natFilter, setNatFilter] = useState<"All"|"Natural"|"Synthetic">("All");
  const [selected,  setSelected]  = useState<Molecule | null>(null);

  const families = ["All", ...Array.from(new Set(MOLECULES.map(m => m.odorFamily))).sort()];

  const filtered = MOLECULES.filter(m => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) &&
        !m.cas.includes(search) &&
        !m.odorDescriptors.some(d => d.toLowerCase().includes(search.toLowerCase()))) return false;
    if (volFilter !== "All" && m.volatility !== volFilter) return false;
    if (famFilter !== "All" && m.odorFamily !== famFilter) return false;
    if (natFilter === "Natural"   && !m.isNatural)  return false;
    if (natFilter === "Synthetic" && m.isNatural)   return false;
    return true;
  });

  return (
    <div style={{ display: "flex", gap: 16, minHeight: 0, flex: 1 }}>
      {/* List panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%",
              transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
            <input className="input-base" style={{ paddingLeft: 30 }}
              placeholder="Search name, CAS, descriptor…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select-base" style={{ width: 120 }} value={volFilter} onChange={e => setVolFilter(e.target.value as any)}>
            <option value="All">All Notes</option>
            <option value="T">Top Note</option>
            <option value="M">Mid Note</option>
            <option value="B">Base Note</option>
          </select>
          <select className="select-base" style={{ width: 130 }} value={famFilter} onChange={e => setFamFilter(e.target.value)}>
            {families.map(f => <option key={f} value={f}>{f === "All" ? "All Families" : f.charAt(0).toUpperCase()+f.slice(1)}</option>)}
          </select>
          <select className="select-base" style={{ width: 130 }} value={natFilter} onChange={e => setNatFilter(e.target.value as any)}>
            <option value="All">Natural + Synth</option>
            <option value="Natural">Natural Only</option>
            <option value="Synthetic">Synthetic Only</option>
          </select>
        </div>

        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>
          {filtered.length} of {MOLECULES.length} molecules
        </div>

        {/* Table */}
        <div className="glass-card" style={{ overflow: "auto", flex: 1 }}>
          <table className="table-base">
            <thead>
              <tr>
                <th>Molecule</th>
                <th>CAS</th>
                <th>Chem Family</th>
                <th>Note</th>
                <th>Intensity</th>
                <th>Threshold</th>
                <th>Substantivity</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} onClick={() => setSelected(selected?.id === m.id ? null : m)}
                  style={{ cursor: "pointer", background: selected?.id === m.id ? "rgba(201,168,76,0.06)" : undefined }}>
                  <td>
                    <div>
                      <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                      <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                        {m.odorDescriptors.slice(0, 3).map(d => (
                          <span key={d} style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{d}</span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{m.cas || "—"}</td>
                  <td>
                    <Chip label={m.chemFamily.replace("_"," ")} color={CHEM_COLORS[m.chemFamily]} />
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 700,
                      background: volColor(m.volatility) + "18",
                      border: `1px solid ${volColor(m.volatility)}44`,
                      color: volColor(m.volatility),
                    }}>{volLabel(m.volatility)}</span>
                  </td>
                  <td style={{ width: 100 }}><IntensityBar value={m.intensity} /></td>
                  <td style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    {m.threshold < 0.001 ? `${m.threshold*1000} ppq` : m.threshold < 1 ? `${m.threshold} ppb` : `${m.threshold} ppb`}
                  </td>
                  <td style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{m.substantivity}h</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      {m.isNatural  && <Chip label="Natural"  color="#22c55e" />}
                      {m.isAllergen && <Chip label="Allergen" color="#f59e0b" />}
                      {m.isIfra     && <Chip label="IFRA"     color="#ef4444" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
              <Atom size={28} style={{ margin: "0 auto 10px" }} />
              <div>No molecules match your filters</div>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="glass-elevated" style={{
          width: 340, flexShrink: 0, display: "flex", flexDirection: "column",
          borderRadius: 12, overflow: "hidden",
        }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>{selected.name}</div>
                <div style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.35)", marginTop: 3 }}>
                  CAS: {selected.cas || "—"}
                </div>
              </div>
              <button className="btn-ghost" style={{ padding: "4px 6px" }} onClick={() => setSelected(null)}>
                <X size={14} />
              </button>
            </div>
            <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
              <Chip label={volLabel(selected.volatility) + " Note"} color={volColor(selected.volatility)} />
              <Chip label={selected.odorFamily} color="#c9a84c" />
              <Chip label={selected.chemFamily.replace("_"," ")} color={CHEM_COLORS[selected.chemFamily]} />
              {selected.isNatural  && <Chip label="Natural"  color="#22c55e" />}
              {selected.isAllergen && <Chip label="Allergen" color="#f59e0b" />}
              {selected.isIfra     && <Chip label="IFRA Restricted" color="#ef4444" />}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {/* Odor descriptors */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                Odor Profile
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {selected.odorDescriptors.map(d => (
                  <span key={d} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.6)" }}>{d}</span>
                ))}
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              {[
                { label: "Intensity",     value: `${selected.intensity} / 10` },
                { label: "Threshold",     value: selected.threshold < 0.001 ? `${selected.threshold*1000} ppq` : `${selected.threshold} ppb` },
                { label: "Substantivity", value: `${selected.substantivity}h on skin` },
                { label: "Boiling Point", value: `${selected.boilingPoint}°C` },
              ].map(s => (
                <div key={s.label} style={{
                  padding: "10px 12px", borderRadius: 8,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)",
                    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#c9a84c", fontFamily: "Georgia, serif" }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Intensity visual */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Odor Intensity</div>
              <IntensityBar value={selected.intensity} />
            </div>

            {/* Perfumer notes */}
            <div style={{ padding: "12px 14px", borderRadius: 8,
              background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)",
              marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#c9a84c",
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                Perfumer's Notes
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                {selected.notes}
              </div>
            </div>

            {/* Blends well with */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                Blends Well With
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {selected.blendsWith.map(bid => {
                  const m = MOLECULES.find(x => x.id === bid);
                  if (!m) return null;
                  return (
                    <div key={bid} onClick={() => setSelected(m)}
                      style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                        padding: "6px 10px", borderRadius: 7,
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                        background: volColor(m.volatility) }} />
                      <span style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{m.name}</span>
                      <ChevronRight size={11} color="rgba(255,255,255,0.25)" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB 2: Odor Wheel
   ═══════════════════════════════════════════════════════════════════════ */
function OdorWheel() {
  const [hovered,  setHovered]  = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const cx = 260; const cy = 260;
  const outerR = 200; const midR = 130; const innerR = 60;
  const total = WHEEL_SEGMENTS.length;

  const active = selected ?? hovered;

  // Get molecules for the active family
  const activeMols = active
    ? MOLECULES.filter(m => m.odorFamily === active)
    : [];

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      {/* SVG Wheel */}
      <div className="glass-card" style={{ padding: 20, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12, textAlign: "center" }}>
          Olfactory Wheel
        </div>
        <svg width={520} height={520} viewBox="0 0 520 520">
          {/* Background glow */}
          <circle cx={cx} cy={cy} r={outerR + 10} fill="rgba(201,168,76,0.03)" />

          {WHEEL_SEGMENTS.map((seg, i) => {
            const startAngle = (i / total) * 2 * Math.PI - Math.PI / 2;
            const endAngle   = ((i + 1) / total) * 2 * Math.PI - Math.PI / 2;
            const midAngle   = (startAngle + endAngle) / 2;
            const isActive   = active === seg.family;
            const gap        = 0.03;

            // Outer ring arc
            const x1 = cx + outerR * Math.cos(startAngle + gap);
            const y1 = cy + outerR * Math.sin(startAngle + gap);
            const x2 = cx + outerR * Math.cos(endAngle   - gap);
            const y2 = cy + outerR * Math.sin(endAngle   - gap);
            const x3 = cx + midR   * Math.cos(endAngle   - gap);
            const y3 = cy + midR   * Math.sin(endAngle   - gap);
            const x4 = cx + midR   * Math.cos(startAngle + gap);
            const y4 = cy + midR   * Math.sin(startAngle + gap);

            const large = endAngle - startAngle > Math.PI ? 1 : 0;
            const path = `M${x1},${y1} A${outerR},${outerR} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${midR},${midR} 0 ${large} 0 ${x4},${y4} Z`;

            // Label pos
            const labelR = (outerR + midR) / 2;
            const lx = cx + labelR * Math.cos(midAngle);
            const ly = cy + labelR * Math.sin(midAngle);

            // Dot count ring
            const dotCount = seg.molecules.length;

            return (
              <g key={seg.family}
                onMouseEnter={() => setHovered(seg.family)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(s => s === seg.family ? null : seg.family)}
                style={{ cursor: "pointer" }}>
                <path
                  d={path}
                  fill={isActive ? seg.color + "40" : seg.color + "18"}
                  stroke={isActive ? seg.color : seg.color + "44"}
                  strokeWidth={isActive ? 1.5 : 0.8}
                  style={{ transition: "all 0.2s" }}
                />
                {/* Text label */}
                <text
                  x={lx} y={ly}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={isActive ? 11 : 10}
                  fontWeight={isActive ? 700 : 400}
                  fill={isActive ? seg.color : seg.color + "bb"}
                  style={{ pointerEvents: "none", textTransform: "capitalize" }}>
                  {seg.family}
                </text>
                {/* Molecule count dot */}
                <text
                  x={cx + (midR - 15) * Math.cos(midAngle)}
                  y={cy + (midR - 15) * Math.sin(midAngle)}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={9} fill={seg.color + "88"}
                  style={{ pointerEvents: "none" }}>
                  {dotCount}
                </text>
              </g>
            );
          })}

          {/* Inner ring: chemical families summary */}
          {WHEEL_SEGMENTS.map((seg, i) => {
            const startAngle = (i / total) * 2 * Math.PI - Math.PI / 2;
            const endAngle   = ((i + 1) / total) * 2 * Math.PI - Math.PI / 2;
            const gap = 0.03;
            const x1 = cx + midR    * Math.cos(startAngle + gap);
            const y1 = cy + midR    * Math.sin(startAngle + gap);
            const x2 = cx + midR    * Math.cos(endAngle   - gap);
            const y2 = cy + midR    * Math.sin(endAngle   - gap);
            const x3 = cx + innerR  * Math.cos(endAngle   - gap);
            const y3 = cy + innerR  * Math.sin(endAngle   - gap);
            const x4 = cx + innerR  * Math.cos(startAngle + gap);
            const y4 = cy + innerR  * Math.sin(startAngle + gap);
            const large = endAngle - startAngle > Math.PI ? 1 : 0;
            const path = `M${x1},${y1} A${midR},${midR} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 ${large} 0 ${x4},${y4} Z`;
            const isActive = active === seg.family;
            return (
              <path key={`inner-${seg.family}`} d={path}
                fill={isActive ? seg.color + "25" : seg.color + "0a"}
                stroke={isActive ? seg.color + "55" : seg.color + "22"}
                strokeWidth={0.8} style={{ pointerEvents: "none" }} />
            );
          })}

          {/* Centre label */}
          <circle cx={cx} cy={cy} r={innerR - 3} fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" />
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize={13} fontWeight={700} fill="rgba(255,255,255,0.6)">
            {active ? active.charAt(0).toUpperCase() + active.slice(1) : "Odor"}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize={10} fill="rgba(255,255,255,0.3)">
            {active ? `${activeMols.length} molecules` : "Families"}
          </text>
        </svg>
      </div>

      {/* Right panel: family info */}
      <div style={{ flex: 1 }}>
        {!active ? (
          <div className="glass-card" style={{ padding: "28px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🌸</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>
              Click a family to explore
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
              {MOLECULES.length} molecules across {WHEEL_SEGMENTS.length} olfactory families
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20, justifyContent: "center" }}>
              {WHEEL_SEGMENTS.map(seg => (
                <button key={seg.family} onClick={() => setSelected(seg.family)}
                  style={{
                    padding: "5px 12px", borderRadius: 99, cursor: "pointer", fontSize: 12,
                    border: `1px solid ${seg.color}44`, background: seg.color + "12", color: seg.color,
                  }}>
                  {seg.family}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="glass-card" style={{ padding: "18px 20px", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 14, height: 14, borderRadius: "50%",
                  background: WHEEL_SEGMENTS.find(s => s.family === active)?.color ?? "#fff",
                }} />
                <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", textTransform: "capitalize" }}>{active}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>family · {activeMols.length} molecules</span>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#c9a84c" }}>{activeMols.filter(m => m.isNatural).length}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Natural</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#60a5fa" }}>{activeMols.filter(m => !m.isNatural).length}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Synthetic</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b" }}>{activeMols.filter(m => m.isAllergen).length}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Allergens</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>
                    {activeMols.length ? (activeMols.reduce((s,m)=>s+m.intensity,0)/activeMols.length).toFixed(1) : "—"}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Avg intensity</div>
                </div>
              </div>
            </div>

            {/* Molecule cards in this family */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {activeMols.map(m => (
                <div key={m.id} className="glass-card" style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{m.name}</span>
                        <Chip label={volLabel(m.volatility)+" Note"} color={volColor(m.volatility)} />
                        {m.isNatural  && <Chip label="Natural"  color="#22c55e" />}
                        {m.isAllergen && <Chip label="Allergen" color="#f59e0b" />}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
                        {m.odorDescriptors.join(" · ")}
                      </div>
                      <IntensityBar value={m.intensity} />
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Lasts</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#c9a84c" }}>{m.substantivity}h</div>
                    </div>
                  </div>
                </div>
              ))}
              {activeMols.length === 0 && (
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", padding: 24 }}>
                  No molecules in this family yet
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB 3: Synergy Map
   ═══════════════════════════════════════════════════════════════════════ */
function SynergyMap() {
  const [molA, setMolA] = useState<string>("iso_e");
  const [molB, setMolB] = useState<string>("ambroxan");

  const findSynergy = (a: string, b: string): SynergyPair | null =>
    SYNERGIES.find(s => (s.a===a&&s.b===b)||(s.a===b&&s.b===a)) ?? null;

  const pair = findSynergy(molA, molB);

  const scoreColor = (s: number) => s >= 5 ? "#22c55e" : s >= 4 ? "#c9a84c" : s >= 3 ? "#60a5fa" : "#94a3b8";
  const scoreLabel = (s: number) => s >= 5 ? "Excellent" : s >= 4 ? "Very Good" : s >= 3 ? "Good" : "Neutral";

  // All synergies involving molA
  const relatedSynergies = SYNERGIES.filter(s => s.a === molA || s.b === molA)
    .map(s => ({
      ...s,
      other: MOLECULES.find(m => m.id === (s.a === molA ? s.b : s.a)),
    }))
    .sort((a, b) => b.score - a.score);

  const molAData = MOLECULES.find(m => m.id === molA);
  const molBData = MOLECULES.find(m => m.id === molB);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Molecule selectors */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, alignItems: "center" }}>
        <div className="glass-card" style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Molecule A</div>
          <select className="select-base" value={molA} onChange={e => setMolA(e.target.value)}>
            {MOLECULES.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          {molAData && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                <Chip label={volLabel(molAData.volatility)+" Note"} color={volColor(molAData.volatility)} />
                <Chip label={molAData.odorFamily} color="#c9a84c" />
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 5 }}>
                {molAData.odorDescriptors.slice(0,3).join(" · ")}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          {pair ? (
            <>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", flexDirection: "column",
                background: scoreColor(pair.score) + "18",
                border: `2px solid ${scoreColor(pair.score)}44`,
              }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: scoreColor(pair.score) }}>{pair.score}</div>
                <div style={{ fontSize: 8, color: scoreColor(pair.score), fontWeight: 600 }}>/5</div>
              </div>
              <div style={{ fontSize: 10, color: scoreColor(pair.score), fontWeight: 700 }}>
                {scoreLabel(pair.score)}
              </div>
            </>
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <span style={{ fontSize: 20 }}>+</span>
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: "16px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Molecule B</div>
          <select className="select-base" value={molB} onChange={e => setMolB(e.target.value)}>
            {MOLECULES.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          {molBData && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                <Chip label={volLabel(molBData.volatility)+" Note"} color={volColor(molBData.volatility)} />
                <Chip label={molBData.odorFamily} color="#c9a84c" />
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 5 }}>
                {molBData.odorDescriptors.slice(0,3).join(" · ")}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Synergy result */}
      {pair && (
        <div style={{
          padding: "18px 22px", borderRadius: 12,
          background: scoreColor(pair.score) + "0a",
          border: `1px solid ${scoreColor(pair.score)}33`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: scoreColor(pair.score),
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Blending Effect
          </div>
          <div style={{ fontSize: 14, color: "#fff", fontStyle: "italic", lineHeight: 1.6 }}>
            "{pair.effect}"
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{
                height: 6, flex: 1, borderRadius: 99,
                background: i <= pair.score ? scoreColor(pair.score) : "rgba(255,255,255,0.06)",
              }} />
            ))}
          </div>
        </div>
      )}

      {!pair && molA !== molB && (
        <div style={{
          padding: "16px 20px", borderRadius: 10,
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
          color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center",
        }}>
          No specific synergy data for this pair — they may still work together well in a formula.
        </div>
      )}

      {/* All synergies for Molecule A */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 10 }}>
          All Known Pairings for {molAData?.name}
        </div>
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <table className="table-base">
            <thead>
              <tr>
                <th>Pairs With</th>
                <th>Note</th>
                <th>Score</th>
                <th>Blending Effect</th>
              </tr>
            </thead>
            <tbody>
              {relatedSynergies.map((s, i) => s.other && (
                <tr key={i} style={{ cursor: "pointer" }}
                  onClick={() => setMolB(s.other!.id)}>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{s.other.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{s.other.odorFamily}</div>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 700,
                      background: volColor(s.other.volatility) + "18",
                      border: `1px solid ${volColor(s.other.volatility)}44`,
                      color: volColor(s.other.volatility),
                    }}>{volLabel(s.other.volatility)}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1,2,3,4,5].map(n => (
                          <div key={n} style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: n <= s.score ? scoreColor(s.score) : "rgba(255,255,255,0.08)",
                          }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 11, color: scoreColor(s.score), fontWeight: 700 }}>
                        {scoreLabel(s.score)}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{s.effect}</td>
                </tr>
              ))}
              {relatedSynergies.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "rgba(255,255,255,0.3)" }}>
                    No synergy data available for this molecule
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB 4: Volatility Curves
   ═══════════════════════════════════════════════════════════════════════ */
function VolatilityCurves() {
  const [visible, setVisible] = useState<Set<string>>(
    new Set(["dhm","linalool","rose","iso_e","ambroxan","musk_e"])
  );
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  const toggle = (id: string) =>
    setVisible(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  // Chart dimensions
  const W = 580; const H = 300;
  const padL = 36; const padR = 16; const padT = 16; const padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const tToX = (t: number) => padL + (t / 8) * chartW;
  const vToY = (v: number) => padT + chartH - (v / 100) * chartH;

  // Build SVG path for a curve
  const buildPath = (curve: number[]) =>
    curve.map((v, i) => `${i === 0 ? "M" : "L"}${tToX(TIME_POINTS[i])},${vToY(v)}`).join(" ");

  // Phase bands
  const phases = [
    { label: "Top",  from: 0, to: 1,  color: "#60a5fa" },
    { label: "Mid",  from: 1, to: 3,  color: "#a78bfa" },
    { label: "Base", from: 3, to: 8,  color: "#c9a84c" },
  ];

  // Interpolated value at hoverTime
  const interpolate = (curve: number[], t: number) => {
    const i = TIME_POINTS.findLastIndex((tp, idx) => tp <= t && idx < TIME_POINTS.length - 1);
    if (i < 0) return curve[0];
    const i2 = i + 1;
    const t1 = TIME_POINTS[i]; const t2 = TIME_POINTS[i2];
    const frac = (t - t1) / (t2 - t1);
    return curve[i] + frac * (curve[i2] - curve[i]);
  };

  const activeCurves = VOL_CURVES.filter(c => visible.has(c.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
        Shows how each molecule's perceived intensity evolves from first application to dry-down.
        Toggle molecules to compare. Hover the chart to read values at a specific time.
      </div>

      {/* Chart */}
      <div className="glass-card" style={{ padding: "20px 24px", overflow: "hidden" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
          Evaporation Curve — Perceived Intensity Over Time
        </div>
        <svg
          width="100%" viewBox={`0 0 ${W} ${H}`}
          style={{ overflow: "visible" }}
          onMouseMove={e => {
            const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const svgX  = (e.clientX - rect.left) * (W / rect.width);
            const t = Math.max(0, Math.min(8, ((svgX - padL) / chartW) * 8));
            setHoverTime(t);
          }}
          onMouseLeave={() => setHoverTime(null)}
        >
          {/* Phase bands */}
          {phases.map(p => (
            <g key={p.label}>
              <rect
                x={tToX(p.from)} y={padT}
                width={tToX(p.to) - tToX(p.from)} height={chartH}
                fill={p.color + "06"}
                stroke={p.color + "18"} strokeWidth={0.5}
              />
              <text
                x={(tToX(p.from) + tToX(p.to)) / 2} y={padT + 10}
                textAnchor="middle" fontSize={10}
                fill={p.color + "66"} fontWeight={700}>
                {p.label}
              </text>
            </g>
          ))}

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(v => (
            <g key={v}>
              <line x1={padL} y1={vToY(v)} x2={W - padR} y2={vToY(v)}
                stroke="rgba(255,255,255,0.05)" strokeDasharray="4,4" />
              <text x={padL - 4} y={vToY(v)} textAnchor="end"
                dominantBaseline="central" fontSize={9} fill="rgba(255,255,255,0.2)">{v}</text>
            </g>
          ))}

          {/* Time axis labels */}
          {TIME_POINTS.map(t => (
            <text key={t} x={tToX(t)} y={padT + chartH + 14}
              textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.3)">
              {t === 0 ? "0h" : `${t}h`}
            </text>
          ))}

          {/* Axis */}
          <line x1={padL} y1={padT} x2={padL} y2={padT + chartH} stroke="rgba(255,255,255,0.1)" />
          <line x1={padL} y1={padT + chartH} x2={W - padR} y2={padT + chartH} stroke="rgba(255,255,255,0.1)" />

          {/* Curves */}
          {activeCurves.map(c => (
            <g key={c.id}>
              <path d={buildPath(c.curve)}
                fill="none" stroke={c.color} strokeWidth={2}
                strokeLinecap="round" strokeLinejoin="round"
                opacity={0.85}
              />
              {/* End label */}
              <text
                x={tToX(8) + 4}
                y={vToY(c.curve[c.curve.length - 1]) + 4}
                fontSize={9} fill={c.color} opacity={0.7}>
                {c.name.split(" ")[0]}
              </text>
            </g>
          ))}

          {/* Hover line */}
          {hoverTime !== null && (
            <>
              <line x1={tToX(hoverTime)} y1={padT}
                x2={tToX(hoverTime)} y2={padT + chartH}
                stroke="rgba(255,255,255,0.25)" strokeDasharray="3,3" />
              {activeCurves.map(c => {
                const v = interpolate(c.curve, hoverTime!);
                return (
                  <circle key={c.id}
                    cx={tToX(hoverTime!)} cy={vToY(v)}
                    r={4} fill={c.color} stroke="rgba(0,0,0,0.5)" strokeWidth={1.5} />
                );
              })}
              {/* Hover tooltip */}
              <rect
                x={Math.min(tToX(hoverTime!) + 8, W - 120)}
                y={padT + 4}
                width={110} height={activeCurves.length * 14 + 20}
                rx={6} fill="rgba(10,8,4,0.92)" stroke="rgba(255,255,255,0.1)" />
              <text x={Math.min(tToX(hoverTime!) + 14, W - 114)} y={padT + 16}
                fontSize={9} fill="rgba(255,255,255,0.5)" fontWeight={700}>
                {hoverTime!.toFixed(1)}h
              </text>
              {activeCurves.map((c, i) => (
                <text key={c.id}
                  x={Math.min(tToX(hoverTime!) + 14, W - 114)}
                  y={padT + 28 + i * 14}
                  fontSize={9} fill={c.color}>
                  {c.name.split(" ")[0]}: {Math.round(interpolate(c.curve, hoverTime!))}%
                </text>
              ))}
            </>
          )}
        </svg>

        {/* Axis labels */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>← Application</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>Dry-down →</div>
        </div>
      </div>

      {/* Toggle legend */}
      <div className="glass-card" style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
          Toggle Molecules
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {VOL_CURVES.map(c => {
            const on = visible.has(c.id);
            const mol = MOLECULES.find(m => m.id === c.id);
            return (
              <button key={c.id} onClick={() => toggle(c.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 99, cursor: "pointer",
                  border: `1px solid ${on ? c.color + "55" : "rgba(255,255,255,0.08)"}`,
                  background: on ? c.color + "14" : "rgba(255,255,255,0.02)",
                  transition: "all 0.15s",
                }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: on ? c.color : "rgba(255,255,255,0.15)",
                }} />
                <span style={{ fontSize: 11, color: on ? c.color : "rgba(255,255,255,0.35)", fontWeight: on ? 600 : 400 }}>
                  {c.name}
                </span>
                {mol && (
                  <span style={{
                    fontSize: 9, padding: "1px 5px", borderRadius: 99,
                    background: volColor(mol.volatility) + "18",
                    color: volColor(mol.volatility),
                    border: `1px solid ${volColor(mol.volatility)}33`,
                  }}>{volLabel(mol.volatility)}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Substantivity table */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "14px 20px 0", fontSize: 13, fontWeight: 700, color: "#fff" }}>
          Substantivity Reference
        </div>
        <table className="table-base" style={{ marginTop: 0 }}>
          <thead>
            <tr>
              <th>Molecule</th>
              <th>Note</th>
              <th>Peak Intensity</th>
              <th>Skin Substantivity</th>
              <th>Evaporation Profile</th>
            </tr>
          </thead>
          <tbody>
            {VOL_CURVES.filter(c => visible.has(c.id)).map(c => {
              const mol = MOLECULES.find(m => m.id === c.id);
              const peak = Math.max(...c.curve);
              const halfLife = TIME_POINTS[c.curve.findIndex(v => v <= peak / 2)] ?? 8;
              return mol && (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                      <span style={{ color: "#fff", fontWeight: 500 }}>{mol.name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 700,
                      background: volColor(mol.volatility) + "18",
                      border: `1px solid ${volColor(mol.volatility)}44`,
                      color: volColor(mol.volatility),
                    }}>{volLabel(mol.volatility)}</span>
                  </td>
                  <td><IntensityBar value={mol.intensity} /></td>
                  <td style={{ color: "#c9a84c", fontWeight: 600 }}>{mol.substantivity}h</td>
                  <td>
                    {/* Mini sparkline */}
                    <svg width={80} height={20} viewBox="0 0 80 20">
                      <polyline
                        points={c.curve.map((v, i) => `${(i / (c.curve.length - 1)) * 80},${20 - (v / 100) * 18}`).join(" ")}
                        fill="none" stroke={c.color} strokeWidth={1.5}
                        strokeLinecap="round" strokeLinejoin="round"
                      />
                    </svg>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ROOT COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
type TabId = "library" | "wheel" | "synergy" | "curves";

const TABS: { id: TabId; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "library", label: "Molecule Library", icon: FlaskConical, desc: "20 molecules · full reference profiles" },
  { id: "wheel",   label: "Odor Wheel",        icon: Droplets,    desc: "10 families · visual explorer"         },
  { id: "synergy", label: "Synergy Map",        icon: Atom,        desc: "20 curated pairings · blending effects" },
  { id: "curves",  label: "Volatility Curves",  icon: TrendingUp,  desc: "Evaporation over 8 hours"              },
];

export function OlfactoryContent() {
  const [tab, setTab] = useState<TabId>("library");
  const current = TABS.find(t => t.id === tab)!;

  return (
    <div className="page-content" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* KPI strip */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Molecules",      value: MOLECULES.length,                                   color: "#c9a84c" },
          { label: "Naturals",       value: MOLECULES.filter(m => m.isNatural).length,           color: "#22c55e" },
          { label: "IFRA Restricted",value: MOLECULES.filter(m => m.isIfra).length,              color: "#ef4444" },
          { label: "Synergy Pairs",  value: SYNERGIES.length,                                    color: "#a78bfa" },
        ].map(k => (
          <div key={k.label} className="glass-card"
            style={{ flex: 1, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 4, height: 32, background: k.color, borderRadius: 99 }} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: k.color, fontFamily: "Georgia, serif" }}>{k.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16,
        background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: 4 }}>
        {TABS.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                background: active ? "rgba(201,168,76,0.12)" : "transparent",
                borderBottom: active ? "2px solid #c9a84c" : "2px solid transparent",
                transition: "all 0.15s",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon size={14} color={active ? "#c9a84c" : "rgba(255,255,255,0.4)"} />
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 400,
                  color: active ? "#c9a84c" : "rgba(255,255,255,0.5)" }}>
                  {t.label}
                </span>
              </div>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{t.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {tab === "library" && <MoleculeLibrary />}
        {tab === "wheel"   && <OdorWheel />}
        {tab === "synergy" && <SynergyMap />}
        {tab === "curves"  && <VolatilityCurves />}
      </div>
    </div>
  );
}
