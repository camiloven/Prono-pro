import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";

const ACCENT = "#00FF87";
const ACCENT2 = "#00C9FF";
const BG = "#0a0a0f";
const CARD = "#12121a";
const CARD2 = "#1a1a26";
const BORDER = "#2a2a3a";

const normalize = (str = "") => str?.toString().trim().toLowerCase();

const findCol = (headers, candidates) => {
  for (const c of candidates) {
    const found = headers.find((h) => normalize(h).includes(normalize(c)));
    if (found) return found;
  }
  return null;
};

const getResult = (row, resultCol) => {
  if (!resultCol) return null;
  const v = normalize(row[resultCol]);
  if (!v) return null;
  if (["ganado","win","si","sí","1"].includes(v)) return "win";
  if (["perdido","loss","lose","no","0"].includes(v)) return "loss";
  if (["empate","draw","void","anulado"].includes(v)) return "draw";
  return null;
};

const confidenceColor = (conf) => {
  const n = parseFloat(conf) || 0;
  if (n >= 80) return "#00FF87";
  if (n >= 60) return "#FFD600";
  if (n >= 40) return "#FF9800";
  return "#FF4444";
};

const StarRating = ({ value }) => {
  const n = parseFloat(value) || 0;
  const stars = Math.round(n / 20);
  return (
    <span style={{ color: "#FFD600" }}>
      {"★".repeat(stars)}{"☆".repeat(5 - stars)}
    </span>
  );
};

const StatCard = ({ label, value, sub, color }) => (
  <div style={{
    background: "#1a1a26",
    border: `1px solid ${color || "#2a2a3a"}`,
    borderRadius: 16,
    padding: "18px 20px",
    flex: "1 1 140px",
    minWidth: 130,
    boxShadow: color ? `0 0 18px ${color}22` : "none"
  }}>
    <div style={{ fontSize: 11, color: "#888", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6, fontFamily: "monospace" }}>{label}</div>
    <div style={{ fontSize: 28, fontWeight: 900, color: color || "#fff", fontFamily: "Impact, sans-serif", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{sub}</div>}
  </div>
);

const MiniBar = ({ pct, color }) => (
  <div style={{ background: "#1a1a26", borderRadius: 4, height: 6, width: "100%", marginTop: 4 }}>
    <div style={{ width: `${Math.min(100, pct || 0)}%`, height: "100%", background: color, borderRadius: 4 }} />
  </div>
);

export default function App() {
  const [predictions, setPredictions] = useState([]);
  const [colMap, setColMap] = useState({});
  const [tab, setTab] = useState("dashboard");
  const [filter, setFilter] = useState("");
  const [filterLeague, setFilterLeague] = useState("all");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef();

  const processFile = useCallback((file) => {
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (!data.length) { setError("El archivo esta vacio."); return; }
        const hdrs = Object.keys(data[0]);
        const cm = {
          partido: findCol(hdrs, ["partido","match","juego","game","encuentro"]),
          liga: findCol(hdrs, ["liga","league","competicion","torneo","division"]),
          pronostico: findCol(hdrs, ["pronostico","prediccion","pick","tip","apuesta"]),
          cuota: findCol(hdrs, ["cuota","odd","quota","momio"]),
          confianza: findCol(hdrs, ["confianza","confidence","conf","certeza"]),
          fecha: findCol(hdrs, ["fecha","date","dia"]),
          resultado: findCol(hdrs, ["resultado","result","estado","status","ganado","win"]),
          mercado: findCol(hdrs, ["mercado","market","tipo","type"]),
        };
        setColMap(cm);
        setPredictions(data);
        setFileName(file.name);
        setTab("dashboard");
      } catch {
        setError("No se pudo leer el archivo. Verifica que sea .xlsx o .csv");
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

  const total = predictions.length;
  const withResult = predictions.filter(r => getResult(r, colMap.resultado) !== null);
  const wins = withResult.filter(r => getResult(r, colMap.resultado) === "win").length;
  const losses = withResult.filter(r => getResult(r, colMap.resultado) === "loss").length;
  const draws = withResult.filter(r => getResult(r, colMap.resultado) === "draw").length;
  const winRate = withResult.length ? ((wins / withResult.length) * 100).toFixed(1) : "-";
  const avgConf = colMap.confianza && predictions.length
    ? (predictions.reduce((s, r) => s + (parseFloat(r[colMap.confianza]) || 0), 0) / predictions.length).toFixed(1) : "-";
  const avgCuota = colMap.cuota && predictions.length
    ? (predictions.reduce((s, r) => s + (parseFloat(r[colMap.cuota]) || 0), 0) / predictions.length).toFixed(2) : "-";
  const profit = colMap.cuota && withResult.length
    ? withResult.reduce((s, r) => {
        const res = getResult(r, colMap.resultado);
        const q = parseFloat(r[colMap.cuota]) || 1;
        if (res === "win") return s + (q - 1);
        if (res === "loss") return s - 1;
        return s;
      }, 0).toFixed(2) : null;

  const leagues = colMap.liga
    ? ["all", ...new Set(predictions.map(r => r[colMap.liga]).filter(Boolean))]
    : ["all"];

  const filtered = predictions.filter(r => {
    const matchText = filter
      ? Object.values(r).some(v => normalize(v).includes(normalize(filter)))
      : true;
    const matchLeague = filterLeague !== "all" && colMap.liga
      ? normalize(r[colMap.liga]) === normalize(filterLeague)
      : true;
    return matchText && matchLeague;
  });

  const leagueStats = colMap.liga
    ? Object.entries(predictions.reduce((acc, r) => {
        const l = r[colMap.liga] || "Sin liga";
        if (!acc[l]) acc[l] = { total: 0, wins: 0, losses: 0 };
        acc[l].total++;
        const res = getResult(r, colMap.resultado);
        if (res === "win") acc[l].wins++;
        if (res === "loss") acc[l].losses++;
        return acc;
      }, {})).sort((a, b) => b[1].total - a[1].total)
    : [];

  const badge = (color) => ({
    display: "inline-block", padding: "3px 10px", borderRadius: 20,
    fontSize: 11, fontWeight: 700, background: `${color}22`,
    color, border: `1px solid ${color}44`
  });

  const cardStyle = {
    background: "#12121a", border: "1px solid #2a2a3a",
    borderRadius: 16, padding: 16, marginBottom: 12
  };

  const navBtn = (active) => ({
    flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
    cursor: "pointer", fontWeight: 700, fontSize: 13,
    background: active ? `${ACCENT}22` : "transparent",
    color: active ? ACCENT : "#666",
    borderBottom: active ? `2px solid ${ACCENT}` : "2px solid transparent"
  });

  if (!predictions.length) return (
    <div style={{ minHeight: "100vh", background: BG, color: "#fff", fontFamily: "Segoe UI, sans-serif" }}>
      <div style={{ background: "#0d0d18", borderBottom: "1px solid #2a2a3a", padding: "16px 20px" }}>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 3, color: ACCENT }}>
          PRONO PRO
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current.click()}
          style={{
            border: `2px dashed ${dragging ? ACCENT : "#2a2a3a"}`,
            borderRadius: 20, padding: "48px 24px", textAlign: "center",
            cursor: "pointer", background: dragging ? "#00FF8708" : "#12121a"
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: ACCENT, marginBottom: 8 }}>
            Sube tu Excel de predicciones
          </div>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
            Toca para seleccionar el archivo
          </div>
          <div style={{ fontSize: 11, color: "#444", fontFamily: "monospace" }}>
            .xlsx .xls .csv
          </div>
          <input
            ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
            style={{ display: "none" }}
            onChange={(e) => e.target.files[0] && processFile(e.target.files[0])}
          />
        </div>
        {error && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#FF444422", border: "1px solid #FF4444", borderRadius: 10, color: "#FF4444", fontSize: 13 }}>
            {error}
          </div>
        )}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
            Columnas reconocidas
          </div>
          {[
            ["Partido","match, juego, game"],
            ["Liga","league, torneo"],
            ["Pronostico","prediccion, pick, tip"],
            ["Cuota","odd, momio"],
            ["Confianza","confidence, %"],
            ["Fecha","date, dia"],
            ["Resultado","result, win/loss, ganado"],
            ["Mercado","market, tipo"],
          ].map(([col, aliases]) => (
            <div key={col} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #2a2a3a", fontSize: 13 }}>
              <span style={{ color: ACCENT, fontWeight: 600 }}>{col}</span>
              <span style={{ color: "#555", fontSize: 11, fontFamily: "monospace" }}>{aliases}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#fff", fontFamily: "Segoe UI, sans-serif", paddingBottom: 80 }}>
      <div style={{ background: "#0d0d18", borderBottom: "1px solid #2a2a3a", padding: "16px 20px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 3, color: ACCENT }}>PRONO PRO</div>
          <button
            onClick={() => { setPredictions([]); setFileName(""); }}
            style={{ background: "#FF444422", border: "1px solid #FF444444", color: "#FF4444", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 700 }}
          >
            Cambiar
          </button>
        </div>
        <div style={{ fontSize: 11, color: "#555", marginTop: 4, fontFamily: "monospace" }}>
          {fileName} · {total} predicciones
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, background: "#12121a", borderRadius: 14, padding: 4, margin: "16px 16px 0" }}>
        {[["dashboard","Stats"],["predictions","Picks"],["leagues","Ligas"]].map(([id, label]) => (
          <button key={id} style={navBtn(tab === id)} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <StatCard label="Total Picks" value={total} color={ACCENT2} />
            <StatCard label="Win Rate" value={withResult.length ? `${winRate}%` : "-"} sub={`${wins}W ${losses}L ${draws}E`} color={ACCENT} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <StatCard label="Confianza avg" value={avgConf !== "-" ? `${avgConf}%` : "-"} color="#FFD600" />
            <StatCard label="Cuota avg" value={avgCuota || "-"} color={ACCENT2} />
            {profit !== null && (
              <StatCard label="Profit u" value={`${parseFloat(profit) > 0 ? "+" : ""}${profit}`} color={parseFloat(profit) > 0 ? ACCENT : "#FF4444"} sub="unidades" />
            )}
          </div>
          {withResult.length > 0 && (
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Rendimiento</div>
              <div style={{ display: "flex", height: 28, borderRadius: 8, overflow: "hidden", gap: 2 }}>
                {wins > 0 && <div style={{ flex: wins, background: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#000" }}>W {wins}</div>}
                {draws > 0 && <div style={{ flex: draws, background: "#FFD600", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#000" }}>E {draws}</div>}
                {losses > 0 && <div style={{ flex: losses, background: "#FF4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>L {losses}</div>}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#666" }}>
                <span style={{ color: ACCENT }}>Analizados: {withResult.length}</span>
                <span>Pendientes: {total - withResult.length}</span>
              </div>
            </div>
          )}
          {colMap.confianza && (
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Distribucion confianza</div>
              {[["Alta 80-100%",80,101,ACCENT],["Media-Alta 60-79%",60,80,"#FFD600"],["Media 40-59%",40,60,"#FF9800"],["Baja 0-39%",0,40,"#FF4444"]].map(([label,min,max,color]) => {
                const count = predictions.filter(r => { const v = parseFloat(r[colMap.confianza]); return v >= min && v < max; }).length;
                const pct = total ? (count / total * 100) : 0;
                return (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color }}>{label}</span>
                      <span style={{ color: "#888" }}>{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <MiniBar pct={pct} color={color} />
                  </div>
                );
              })}
            </div>
          )}
          {colMap.confianza && (
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Top 5 por confianza</div>
              {[...predictions]
                .sort((a,b) => (parseFloat(b[colMap.confianza])||0) - (parseFloat(a[colMap.confianza])||0))
                .slice(0,5)
                .map((r,i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #2a2a3a" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{r[colMap.partido] || `Pick ${i+1}`}</div>
                      {colMap.pronostico && <div style={{ fontSize: 11, color: "#888" }}>{r[colMap.pronostico]}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: confidenceColor(r[colMap.confianza]) }}>{r[colMap.confianza]}%</div>
                      {colMap.cuota && <div style={{ fontSize: 11, color: "#555" }}>@{r[colMap.cuota]}</div>}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {tab === "predictions" && (
        <div style={{ padding: 16 }}>
          <input
            style={{ width: "100%", background: CARD2, border: "1px solid #2a2a3a", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12 }}
            placeholder="Buscar partido, equipo..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          {colMap.liga && (
            <div style={{ marginBottom: 12, overflowX: "auto", display: "flex", gap: 6, paddingBottom: 4 }}>
              {leagues.map(l => (
                <button key={l} onClick={() => setFilterLeague(l)}
                  style={{ ...badge(filterLeague === l ? ACCENT : "#555"), cursor: "pointer", whiteSpace: "nowrap", fontSize: 12, padding: "5px 12px" }}>
                  {l === "all" ? "Todas" : l}
                </button>
              ))}
            </div>
          )}
          <div style={{ fontSize: 12, color: "#555", marginBottom: 8 }}>{filtered.length} picks</div>
          {filtered.map((row, i) => {
            const res = getResult(row, colMap.resultado);
            const resColor = res === "win" ? ACCENT : res === "loss" ? "#FF4444" : res === "draw" ? "#FFD600" : "#555";
            const conf = colMap.confianza ? parseFloat(row[colMap.confianza]) : null;
            return (
              <div key={i} style={{ ...cardStyle, borderLeft: `3px solid ${resColor}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{row[colMap.partido] || `Pick ${i+1}`}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {colMap.liga && row[colMap.liga] && <span style={badge(ACCENT2)}>{row[colMap.liga]}</span>}
                      {colMap.mercado && row[colMap.mercado] && <span style={badge("#888")}>{row[colMap.mercado]}</span>}
                      {colMap.fecha && row[colMap.fecha] && <span style={{ fontSize: 11, color: "#555" }}>{row[colMap.fecha]}</span>}
                    </div>
                  </div>
                  {res && <span style={{ ...badge(resColor), fontSize: 13, fontWeight: 900 }}>{res === "win" ? "W" : res === "loss" ? "L" : "E"}</span>}
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  {colMap.pronostico && <div style={{ fontSize: 14, fontWeight: 700, color: ACCENT }}>{row[colMap.pronostico]}</div>}
                  {colMap.cuota && <div style={{ fontSize: 13, color: "#FFD600", fontWeight: 600 }}>@{row[colMap.cuota]}</div>}
                  {conf !== null && (
                    <div style={{ marginLeft: "auto", textAlign: "right" }}>
                      <StarRating value={conf} />
                      <div style={{ fontSize: 12, color: confidenceColor(conf), fontWeight: 700 }}>{conf}%</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "leagues" && (
        <div style={{ padding: 16 }}>
          {leagueStats.length === 0
            ? <div style={{ textAlign: "center", color: "#555", padding: 40 }}>No se detecto columna de Liga</div>
            : leagueStats.map(([liga, st]) => {
                const wr = st.wins + st.losses > 0 ? (st.wins / (st.wins + st.losses) * 100) : 0;
                return (
                  <div key={liga} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{liga}</div>
                      <div style={{ fontSize: 13, color: "#666" }}>{st.total} picks</div>
                    </div>
                    <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                      <span style={badge(ACCENT)}>{st.wins}W</span>
                      <span style={badge("#FF4444")}>{st.losses}L</span>
                      {st.total - st.wins - st.losses > 0 && <span style={badge("#888")}>{st.total - st.wins - st.losses} pendientes</span>}
                    </div>
                    {st.wins + st.losses > 0 && (
                      <>
                        <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                          Win rate: <span style={{ color: ACCENT, fontWeight: 700 }}>{wr.toFixed(1)}%</span>
                        </div>
                        <MiniBar pct={wr} color={ACCENT} />
                      </>
                    )}
                  </div>
                );
              })}
        </div>
      )}

      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 200 }}>
        <button
          onClick={() => fileRef.current?.click()}
          style={{ background: `linear-gradient(135deg,${ACCENT},${ACCENT2})`, border: "none", borderRadius: "50%", width: 52, height: 52, fontSize: 22, cursor: "pointer" }}
        >
          📤
        </button>
        <input
          ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={(e) => e.target.files[0] && processFile(e.target.files[0])}
        />
      </div>
    </div>
  );
}
