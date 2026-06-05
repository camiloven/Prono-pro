import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";

const ACCENT = "#00FF87";
const ACCENT2 = "#00C9FF";
const BG = "#0a0a0f";
const CARD = "#12121a";
const CARD2 = "#1a1a26";
const BORDER = "#2a2a3a";

const pct = (v) => v != null && v !== "" ? `${(parseFloat(v) * 100).toFixed(0)}%` : "-";
const conf = (v) => v != null && v !== "" ? parseFloat(v) : null;

const bestPick = (row) => {
  const h = conf(row["1x2_h"]);
  const d = conf(row["1x2_d"]);
  const a = conf(row["1x2_a"]);
  if (h == null && d == null && a == null) return null;
  const max = Math.max(h ?? 0, d ?? 0, a ?? 0);
  if (max === h) return { label: "1 (Local)", prob: h, color: ACCENT };
  if (max === d) return { label: "X (Empate)", prob: d, color: "#FFD600" };
  return { label: "2 (Visitante)", prob: a, color: "#FF6B6B" };
};

const overUnder = (row) => {
  const o25 = conf(row["o_2.5"]);
  const u25 = conf(row["u_2.5"]);
  if (o25 == null && u25 == null) return null;
  if (o25 != null && (u25 == null || o25 > u25)) return { label: "Over 2.5", prob: o25, color: "#00C9FF" };
  return { label: "Under 2.5", prob: u25, color: "#FF9800" };
};

const confColor = (v) => {
  if (v >= 0.7) return ACCENT;
  if (v >= 0.55) return "#FFD600";
  if (v >= 0.4) return "#FF9800";
  return "#FF4444";
};

const MiniBar = ({ pct, color }) => (
  <div style={{ background: "#1a1a26", borderRadius: 4, height: 6, width: "100%", marginTop: 4 }}>
    <div style={{ width: `${Math.min(100, (pct || 0) * 100)}%`, height: "100%", background: color, borderRadius: 4 }} />
  </div>
);

const StatCard = ({ label, value, sub, color }) => (
  <div style={{ background: CARD2, border: `1px solid ${color || BORDER}`, borderRadius: 16, padding: "16px 18px", flex: "1 1 130px", minWidth: 120, boxShadow: color ? `0 0 16px ${color}22` : "none" }}>
    <div style={{ fontSize: 10, color: "#888", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4, fontFamily: "monospace" }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 900, color: color || "#fff", fontFamily: "Impact, sans-serif", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{sub}</div>}
  </div>
);

export default function App() {
  const [data, setData] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [filter, setFilter] = useState("");
  const [filterLeague, setFilterLeague] = useState("all");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const processFile = useCallback((file) => {
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (!rows.length) { setError("El archivo está vacío."); return; }
        setData(rows);
        setFileName(file.name);
        setTab("dashboard");
      } catch {
        setError("No se pudo leer el archivo.");
      }
    };
    reader.readAsBinaryString(file);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, [processFile]);

  // Stats
  const total = data.length;
  const leagues = ["all", ...new Set(data.map(r => r.league).filter(Boolean))];
  const filtered = data.filter(r => {
    const txt = filter ? `${r.home} ${r.away} ${r.league}`.toLowerCase().includes(filter.toLowerCase()) : true;
    const lg = filterLeague !== "all" ? r.league === filterLeague : true;
    return txt && lg;
  });

  // Top picks: highest max probability
  const topPicks = [...data]
    .map(r => ({ r, pick: bestPick(r) }))
    .filter(x => x.pick)
    .sort((a, b) => b.pick.prob - a.pick.prob)
    .slice(0, 5);

  // Avg confidence
  const avgConf = data.length
    ? (data.reduce((s, r) => {
        const p = bestPick(r);
        return s + (p ? p.prob : 0);
      }, 0) / data.length * 100).toFixed(1)
    : "-";

  // High confidence picks (>65%)
  const highConf = data.filter(r => { const p = bestPick(r); return p && p.prob >= 0.65; }).length;

  // Over/Under split
  const overCount = data.filter(r => { const o = overUnder(r); return o && o.label.startsWith("Over"); }).length;
  const underCount = data.filter(r => { const o = overUnder(r); return o && o.label.startsWith("Under"); }).length;

  // League stats
  const leagueStats = Object.entries(
    data.reduce((acc, r) => {
      const l = r.league || "Sin liga";
      if (!acc[l]) acc[l] = { total: 0, highConf: 0 };
      acc[l].total++;
      const p = bestPick(r);
      if (p && p.prob >= 0.65) acc[l].highConf++;
      return acc;
    }, {})
  ).sort((a, b) => b[1].total - a[1].total);

  const s = {
    app: { minHeight: "100vh", background: BG, color: "#fff", fontFamily: "Segoe UI, sans-serif", paddingBottom: 80 },
    header: { background: "#0d0d18", borderBottom: `1px solid ${BORDER}`, padding: "14px 18px", position: "sticky", top: 0, zIndex: 100 },
    logo: { fontSize: 22, fontWeight: 900, letterSpacing: 3, color: ACCENT },
    nav: { display: "flex", gap: 4, background: CARD, borderRadius: 14, padding: 4, margin: "14px 14px 0" },
    navBtn: (a) => ({ flex: 1, padding: "9px 0", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 12, background: a ? `${ACCENT}22` : "transparent", color: a ? ACCENT : "#666", borderBottom: a ? `2px solid ${ACCENT}` : "2px solid transparent" }),
    sec: { padding: 14 },
    card: { background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 14, marginBottom: 10 },
    badge: (c) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${c}22`, color: c, border: `1px solid ${c}44` }),
  };

  if (!data.length) return (
    <div style={s.app}>
      <div style={s.header}><div style={s.logo}>⚽ PRONO PRO</div></div>
      <div style={s.sec}>
        <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}
          onClick={() => fileRef.current.click()}
          style={{ border: `2px dashed ${dragging ? ACCENT : BORDER}`, borderRadius: 20, padding: "48px 20px", textAlign: "center", cursor: "pointer", background: dragging ? "#00FF8708" : CARD }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: ACCENT, marginBottom: 8 }}>Sube tu Excel de predicciones</div>
          <div style={{ fontSize: 12, color: "#666" }}>Toca para seleccionar · .xlsx .xls .csv</div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={(e) => e.target.files[0] && processFile(e.target.files[0])} />
        </div>
        {error && <div style={{ marginTop: 10, padding: "10px 14px", background: "#FF444422", border: "1px solid #FF4444", borderRadius: 10, color: "#FF4444", fontSize: 13 }}>{error}</div>}
        <div style={{ ...s.card, marginTop: 14 }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 8, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Formato compatible con tu Excel</div>
          {[["home / away","Equipos local y visitante"],["league","Liga o competición"],["date","Fecha del partido"],["1x2_h / 1x2_d / 1x2_a","Probabilidades 1X2"],["o_2.5 / u_2.5","Over/Under 2.5"],["ah_X_h / ah_X_a","Asian Handicap"]].map(([col, desc]) => (
            <div key={col} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid ${BORDER}`, fontSize: 12 }}>
              <span style={{ color: ACCENT, fontFamily: "monospace" }}>{col}</span>
              <span style={{ color: "#555" }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.app}>
      <div style={s.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={s.logo}>⚽ PRONO PRO</div>
          <button onClick={() => { setData([]); setFileName(""); }} style={{ background: "#FF444422", border: "1px solid #FF444444", color: "#FF4444", borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>Cambiar</button>
        </div>
        <div style={{ fontSize: 10, color: "#555", marginTop: 3, fontFamily: "monospace" }}>{fileName} · {total} partidos</div>
      </div>

      <div style={s.nav}>
        {[["dashboard","📈 Stats"],["picks","🎯 Picks"],["leagues","🏆 Ligas"]].map(([id, label]) => (
          <button key={id} style={s.navBtn(tab === id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div style={s.sec}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <StatCard label="Partidos" value={total} color={ACCENT2} />
            <StatCard label="Alta confianza" value={highConf} sub="+65% prob" color={ACCENT} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            <StatCard label="Confianza avg" value={`${avgConf}%`} color="#FFD600" />
            <StatCard label="Over 2.5" value={overCount} sub={`Under: ${underCount}`} color="#00C9FF" />
          </div>

          {/* Over/Under bar */}
          <div style={s.card}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Over vs Under 2.5</div>
            <div style={{ display: "flex", height: 26, borderRadius: 8, overflow: "hidden", gap: 2 }}>
              {overCount > 0 && <div style={{ flex: overCount, background: ACCENT2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#000" }}>Over {overCount}</div>}
              {underCount > 0 && <div style={{ flex: underCount, background: "#FF9800", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#000" }}>Under {underCount}</div>}
            </div>
          </div>

          {/* Top 5 picks */}
          <div style={s.card}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>🔥 Top 5 picks más confiables</div>
            {topPicks.map(({ r, pick }, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{r.home} vs {r.away}</div>
                  <div style={{ fontSize: 11, color: "#666" }}>{r.league}</div>
                  <span style={{ ...s.badge(pick.color), marginTop: 3 }}>{pick.label}</span>
                </div>
                <div style={{ textAlign: "right", minWidth: 50 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: confColor(pick.prob) }}>{pct(pick.prob)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Distribución 1X2 */}
          <div style={s.card}>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Distribución 1X2</div>
            {[["Local (1)", ACCENT, r => conf(r["1x2_h"])], ["Empate (X)", "#FFD600", r => conf(r["1x2_d"])], ["Visitante (2)", "#FF6B6B", r => conf(r["1x2_a"])]].map(([label, color, getter]) => {
              const count = data.filter(r => { const vals = [conf(r["1x2_h"]), conf(r["1x2_d"]), conf(r["1x2_a"])].filter(v => v != null); const g = getter(r); return g != null && g === Math.max(...vals); }).length;
              return (
                <div key={label} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color }}>{label}</span>
                    <span style={{ color: "#888" }}>{count} partidos ({total ? (count/total*100).toFixed(0) : 0}%)</span>
                  </div>
                  <MiniBar pct={{ prob: count / total }} color={color} />
                  <div style={{ background: "#1a1a26", borderRadius: 4, height: 6, width: "100%", marginTop: 4 }}>
                    <div style={{ width: `${total ? (count/total*100) : 0}%`, height: "100%", background: color, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "picks" && (
        <div style={s.sec}>
          <input style={{ width: "100%", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 10 }}
            placeholder="Buscar equipo o liga..." value={filter} onChange={e => setFilter(e.target.value)} />
          <div style={{ marginBottom: 10, overflowX: "auto", display: "flex", gap: 6, paddingBottom: 4 }}>
            {leagues.slice(0, 10).map(l => (
              <button key={l} onClick={() => setFilterLeague(l)}
                style={{ ...s.badge(filterLeague === l ? ACCENT : "#555"), cursor: "pointer", whiteSpace: "nowrap", fontSize: 11, padding: "4px 10px" }}>
                {l === "all" ? "Todas" : l}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 8 }}>{filtered.length} partidos</div>
          {filtered.map((row, i) => {
            const pick = bestPick(row);
            const ou = overUnder(row);
            return (
              <div key={i} style={{ ...s.card, borderLeft: `3px solid ${pick ? pick.color : BORDER}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                  {row.home} <span style={{ color: "#555" }}>vs</span> {row.away}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  <span style={s.badge(ACCENT2)}>{row.league}</span>
                  {row.date && <span style={{ fontSize: 10, color: "#555", alignSelf: "center" }}>📅 {row.date}</span>}
                </div>
                {/* 1X2 probabilities */}
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  {[["1", row["1x2_h"], ACCENT], ["X", row["1x2_d"], "#FFD600"], ["2", row["1x2_a"], "#FF6B6B"]].map(([label, val, color]) => {
                    const v = conf(val);
                    const isPick = pick && ((label === "1" && pick.label.startsWith("1")) || (label === "X" && pick.label.startsWith("X")) || (label === "2" && pick.label.startsWith("2")));
                    return v != null ? (
                      <div key={label} style={{ flex: 1, background: isPick ? `${color}22` : "#1a1a26", border: `1px solid ${isPick ? color : BORDER}`, borderRadius: 8, padding: "6px 0", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#888" }}>{label}</div>
                        <div style={{ fontSize: 15, fontWeight: 900, color: isPick ? color : "#ccc" }}>{pct(val)}</div>
                      </div>
                    ) : null;
                  })}
                </div>
                {/* Over/Under */}
                {ou && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={s.badge(ou.color)}>{ou.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: ou.color }}>{pct(ou.prob)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "leagues" && (
        <div style={s.sec}>
          {leagueStats.map(([liga, st]) => (
            <div key={liga} style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{liga}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{st.total} partidos</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={s.badge(ACCENT)}>🔥 {st.highConf} alta conf.</span>
                <span style={s.badge("#555")}>{st.total - st.highConf} normales</span>
              </div>
              <div style={{ background: "#1a1a26", borderRadius: 4, height: 6, width: "100%", marginTop: 8 }}>
                <div style={{ width: `${st.total ? (st.highConf/st.total*100) : 0}%`, height: "100%", background: ACCENT, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                {st.total ? (st.highConf/st.total*100).toFixed(0) : 0}% picks con alta confianza
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 200 }}>
        <button onClick={() => fileRef.current?.click()}
          style={{ background: `linear-gradient(135deg,${ACCENT},${ACCENT2})`, border: "none", borderRadius: "50%", width: 52, height: 52, fontSize: 22, cursor: "pointer" }}>📤</button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={(e) => e.target.files[0] && processFile(e.target.files[0])} />
      </div>
    </div>
  );
}
