import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

// 🔑 CREDENCIALES DE ACCESO
const ADMIN_KEY = "JACOBO_ADMIN_2026";      
const CLIENT_KEY = "PRONO_MASTER_2026";     

export default function App() {
  const [inputKey, setInputKey] = useState('');
  const [role, setRole] = useState(null); 
  const [error, setError] = useState('');
  
  const [predictions, setPredictions] = useState(() => {
    const saved = localStorage.getItem('prono_data_store');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const savedRole = localStorage.getItem('prono_user_role');
    if (savedRole === 'admin' || savedRole === 'client') {
      setRole(savedRole);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const cleanKey = inputKey.trim();
    if (cleanKey === ADMIN_KEY) {
      setRole('admin');
      localStorage.setItem('prono_user_role', 'admin');
      setError('');
    } else if (cleanKey === CLIENT_KEY) {
      setRole('client');
      localStorage.setItem('prono_user_role', 'client');
      setError('');
    } else {
      setError('❌ Código incorrecto.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('prono_user_role');
    setRole(null);
    setInputKey('');
  };

  // 📂 PROCESADOR DOBLE: ENCUENTRA EL MEJOR 1X2 Y EL MEJOR MERCADO DE GOLES
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        let allMatches = [];

        wb.SheetNames.forEach((sheetName) => {
          const ws = wb.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(ws);
          
          data.forEach((row, index) => {
            if (row.home && row.away) {
              
              // --- 1. EVALUAR MERCADO GANADOR (1X2) ---
              let ganadorProno = "Sin datos 1X2";
              let opciones1X2 = [];
              if (row['1x2_h'] !== undefined) opciones1X2.push({ tipo: `Victoria Local`, prob: parseFloat(row['1x2_h'] || 0) });
              if (row['1x2_a'] !== undefined) opciones1X2.push({ tipo: `Victoria Visitante`, prob: parseFloat(row['1x2_a'] || 0) });
              if (row['1x2_d'] !== undefined) opciones1X2.push({ tipo: `Empate`, prob: parseFloat(row['1x2_d'] || 0) });

              if (opciones1X2.length > 0) {
                opciones1X2.sort((a, b) => b.prob - a.prob);
                ganadorProno = `${opciones1X2[0].tipo} (${Math.round(opciones1X2[0].prob * 100)}%)`;
              }

              // --- 2. EVALUAR MERCADO DE GOLES (OVER / UNDER) ---
              let golesProno = "Sin datos Goles";
              let opcionesGoles = [];
              
              // Revisamos todas las líneas de goles posibles que vengan en tu Excel
              if (row['o_2.5'] !== undefined) opcionesGoles.push({ tipo: `Más de 2.5 Goles`, prob: parseFloat(row['o_2.5'] || 0) });
              if (row['u_2.5'] !== undefined) opcionesGoles.push({ tipo: `Menos de 2.5 Goles`, prob: parseFloat(row['u_2.5'] || 0) });
              if (row['o_1.5'] !== undefined) opcionesGoles.push({ tipo: `Más de 1.5 Goles`, prob: parseFloat(row['o_1.5'] || 0) });
              if (row['u_1.5'] !== undefined) opcionesGoles.push({ tipo: `Menos de 1.5 Goles`, prob: parseFloat(row['u_1.5'] || 0) });
              if (row['o_3.5'] !== undefined) opcionesGoles.push({ tipo: `Más de 3.5 Goles`, prob: parseFloat(row['o_3.5'] || 0) });
              if (row['u_3.5'] !== undefined) opcionesGoles.push({ tipo: `Menos de 3.5 Goles`, prob: parseFloat(row['u_3.5'] || 0) });

              if (opcionesGoles.length > 0) {
                opcionesGoles.sort((a, b) => b.prob - a.prob);
                golesProno = `${opcionesGoles[0].tipo} (${Math.round(opcionesGoles[0].prob * 100)}%)`;
              }

              allMatches.push({
                id: `${sheetName}-${Date.now()}-${index}`,
                deporte: sheetName.toUpperCase(),
                evento: `${row.home} vs ${row.away}`,
                liga: row.league || "Torneo General",
                horario: row.date || "Hoy",
                pronoGanador: ganadorProno,
                pronoGoles: golesProno,
                estado: "Pendiente",
                visible: false 
              });
            }
          });
        });

        if (allMatches.length === 0) {
          alert("No se encontraron registros procesables.");
          return;
        }

        setPredictions(allMatches);
        localStorage.setItem('prono_data_store', JSON.stringify(allMatches));
        alert(`¡Éxito! ${allMatches.length} partidos cargados con doble mercado (Resultado + Goles).`);
      } catch (err) {
        alert("Error al procesar las columnas de goles y 1X2 del Excel.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const toggleVisibility = (id) => {
    const updated = predictions.map(p => p.id === id ? { ...p, visible: !p.visible } : p);
    setPredictions(updated);
    localStorage.setItem('prono_data_store', JSON.stringify(updated));
  };

  const clearAll = () => {
    if(window.confirm("¿Borrar todo?")) {
      setPredictions([]);
      localStorage.removeItem('prono_data_store');
    }
  };

  const displayedPredictions = role === 'admin' ? predictions : predictions.filter(p => p.visible);

  return (
    <div style={{ backgroundColor: '#0d0e12', color: '#fff', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', padding: '15px' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '650px', margin: '0 auto 20px auto', background: '#16181f', padding: '12px 20px', borderRadius: '10px', border: '1px solid #252836' }}>
        <div>
          <span style={{ color: role === 'admin' ? '#ff9f0a' : '#00df9a', fontWeight: 'bold', fontSize: '14px' }}>
            {role === 'admin' ? '⚙️ PANEL ADMINISTRADOR' : '💎 CLIENTE PREMIUM'}
          </span>
        </div>
        <button onClick={handleLogout} style={{ backgroundColor: '#ff453a', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
          Salir
        </button>
      </div>

      {/* LOGIN O CONTENIDO */}
      {!role ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '100px' }}>
          <div style={{ width: '100%', maxWidth: '380px', background: '#16181f', padding: '30px 20px', borderRadius: '16px', border: '1px solid #252836', textAlign: 'center' }}>
            <h1 style={{ color: '#00df9a', margin: '0 0 5px 0', fontSize: '26px' }}>📊 PRONO PRO</h1>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <input
                type="password"
                placeholder="Código de Acceso"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #353945', backgroundColor: '#1e222b', color: '#fff', fontSize: '16px', textAlign: 'center' }}
              />
              <button type="submit" style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#00df9a', color: '#000', fontSize: '16px', fontWeight: 'bold' }}>
                Ingresar
              </button>
            </form>
            {error && <p style={{ color: '#ff453a', fontSize: '13px', marginTop: '12px' }}>{error}</p>}
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: '650px', margin: '0 auto' }}>
          
          {role === 'admin' && (
            <div style={{ background: '#1c1f2e', padding: '20px', borderRadius: '12px', border: '1px solid #353945', marginBottom: '25px', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#ff9f0a' }}>Módulo Multi-Pronóstico</h3>
              <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '15px' }}>Al cargar el Excel, se extraerá simultáneamente la mejor opción de ganador y goles.</p>
              
              <label style={{ display: 'block', backgroundColor: '#ff9f0a', color: '#000', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
                ⚡ Cargar Archivo de Datos
                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
              <button onClick={clearAll} style={{ background: 'none', border: 'none', color: '#ff453a', fontSize: '12px', textDecoration: 'underline' }}>
                Resetear datos actuales
              </button>
            </div>
          )}

          <h2 style={{ textAlign: 'center', margin: '0 0 20px 0', fontSize: '22px', color: '#fff' }}>📈 Panel de Inversión Deportiva</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displayedPredictions.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#72768d', padding: '40px 0' }}>Buscando alertas premium habilitadas...</p>
            ) : (
              displayedPredictions.map((p) => (
                <div key={p.id} style={{ 
                  background: '#16181f', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  border: role === 'admin' ? (p.visible ? '2px solid #00df9a' : '1px solid #3a3a3c') : '1px solid #252836',
                  opacity: role === 'admin' && !p.visible ? 0.6 : 1
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: '#252836', padding: '3px 8px', borderRadius: '4px', color: '#00df9a' }}>
                      {p.deporte}
                    </span>
                    
                    {role === 'admin' ? (
                      <button 
                        onClick={() => toggleVisibility(p.id)}
                        style={{ backgroundColor: p.visible ? '#00df9a' : '#3a3a3c', color: '#000', border: 'none', padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' }}
                      >
                        {p.visible ? '👁️ Habilitado' : '❌ Oculto'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#72768d' }}>{p.horario}</span>
                    )}
                  </div>
                  
                  <h4 style={{ margin: '5px 0', fontSize: '16px', color: '#fff' }}>{p.evento}</h4>
                  <p style={{ fontSize: '13px', color: '#72768d', margin: '0 0 12px 0' }}>🏆 {p.liga}</p>
                  
                  {/* CONTAINER DE DOBLE PREDICCIÓN */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    
                    {/* Pronóstico 1: Tendencia del Resultado */}
                    <div style={{ background: '#1e2230', padding: '10px 14px', borderRadius: '8px', borderLeft: '4px solid #00df9a' }}>
                      <span style={{ fontSize: '11px', color: '#72768d', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Tendencia 1X2</span>
                      <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>{p.pronoGanador}</span>
                    </div>

                    {/* Pronóstico 2: Tendencia de Goles */}
                    <div style={{ background: '#1e2230', padding: '10px 14px', borderRadius: '8px', borderLeft: '4px solid #ff9f0a' }}>
                      <span style={{ fontSize: '11px', color: '#72768d', display: 'block', textTransform: 'uppercase', fontWeight: 'bold' }}>Línea de Goles / Sets</span>
                      <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>{p.pronoGoles}</span>
                    </div>

                  </div>

                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
          }
                        
