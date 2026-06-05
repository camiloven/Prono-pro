import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

// 🔑 CREDENCIALES DE ACCESO
const ADMIN_KEY = "JACOBO_ADMIN_2026";      
const CLIENT_KEY = "PRONO_MASTER_2026";     

export default function App() {
  const [inputKey, setInputKey] = useState('');
  const [role, setRole] = useState(null); 
  const [error, setError] = useState('');
  
  // Guardado local de datos
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

  // 📂 PROCESADOR INTELIGENTE DE TU EXCEL
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        let allMatches = [];

        // Lee absolutamente todas las pestañas de deportes (soccer, tennis, basketball, etc.)
        wb.SheetNames.forEach((sheetName) => {
          const ws = wb.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(ws);
          
          data.forEach((row, index) => {
            if (row.home && row.away) {
              // 🧠 Lógica para deducir el pronóstico inteligente basado en las cuotas/probabilidades más altas
              let sugerenciaProno = "Analizando tendencias";
              let probabilidad = 0;

              if (row['1x2_h'] && row['1x2_a']) {
                const homeProb = parseFloat(row['1x2_h']);
                const drawProb = row['1x2_d'] ? parseFloat(row['1x2_d']) : 0;
                const awayProb = parseFloat(row['1x2_a']);

                if (homeProb > awayProb && homeProb > 0.5) {
                  sugerenciaProno = `Victoria Local (${Math.round(homeProb * 100)}%)`;
                } else if (awayProb > homeProb && awayProb > 0.5) {
                  sugerenciaProno = `Victoria Visitante (${Math.round(awayProb * 100)}%)`;
                } else {
                  sugerenciaProno = `Doble Oportunidad / Analizar Cuotas`;
                }
              } else if (row['o_2.5']) {
                // Si es tenis/básquet y tiene columnas de over de puntos o sets
                const overProb = parseFloat(row['o_2.5']);
                if (overProb > 0.55) sugerenciaProno = `Más de 2.5 Goles/Sets (${Math.round(overProb * 100)}%)`;
              }

              allMatches.push({
                id: `${sheetName}-${Date.now()}-${index}`,
                deporte: sheetName.toUpperCase(),
                evento: `${row.home} vs ${row.away}`,
                liga: row.league || "Torneo General",
                horario: row.date || "Hoy",
                prono: sugerenciaProno,
                estado: "Pendiente"
              });
            }
          });
        });

        if (allMatches.length === 0) {
          alert("No se detectaron datos válidos. Revisa que las columnas digan 'home' y 'away'.");
          return;
        }

        setPredictions(allMatches);
        localStorage.setItem('prono_data_store', JSON.stringify(allMatches));
        alert(`¡Éxito total! Se importaron de golpe ${allMatches.length} partidos de todas las categorías.`);
      } catch (err) {
        alert("Ocurrió un error leyendo el archivo Excel.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const clearAll = () => {
    if(window.confirm("¿Seguro que quieres limpiar los pronósticos?")) {
      setPredictions([]);
      localStorage.removeItem('prono_data_store');
    }
  };

  // 1️⃣ LOGIN
  if (!role) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0d0e12', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '380px', background: '#16181f', padding: '30px 20px', borderRadius: '16px', border: '1px solid #252836', textAlign: 'center' }}>
          <h1 style={{ color: '#00df9a', margin: '0 0 5px 0', fontSize: '26px' }}>📊 PRONO PRO</h1>
          <p style={{ color: '#72768d', fontSize: '13px', marginBottom: '25px' }}>Acceso seguro al Protocolo Maestro</p>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="password"
              placeholder="Código Secreto"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #353945', backgroundColor: '#1e222b', color: '#fff', fontSize: '16px', boxSizing: 'border-box', textAlign: 'center' }}
            />
            <button type="submit" style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#00df9a', color: '#000', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              Ingresar
            </button>
          </form>
          {error && <p style={{ color: '#ff453a', fontSize: '13px', marginTop: '12px' }}>{error}</p>}
        </div>
      </div>
    );
  }

  // 2️⃣ DASHBOARD
  return (
    <div style={{ backgroundColor: '#0d0e12', color: '#fff', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', padding: '15px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '650px', margin: '0 auto 20px auto', background: '#16181f', padding: '12px 20px', borderRadius: '10px', border: '1px solid #252836' }}>
        <div>
          <span style={{ color: role === 'admin' ? '#ff9f0a' : '#00df9a', fontWeight: 'bold', fontSize: '14px' }}>
            {role === 'admin' ? '⚙️ MÓDULO CARGA EXCEL' : '💎 CLIENTE PREMIUM'}
          </span>
        </div>
        <button onClick={handleLogout} style={{ backgroundColor: '#ff453a', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
          Salir
        </button>
      </div>

      <div style={{ maxWidth: '650px', margin: '0 auto' }}>
        
        {role === 'admin' && (
          <div style={{ background: '#1c1f2e', padding: '20px', borderRadius: '12px', border: '1px solid #353945', marginBottom: '25px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#ff9f0a' }}>Carga masiva por Deporte</h3>
            <p style={{ fontSize: '13px', color: '#aaa', marginBottom: '15px' }}>Sube el archivo directo desde la memoria de tu celular.</p>
            
            <label style={{
              display: 'block',
              backgroundColor: '#ff9f0a',
              color: '#000',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '10px'
            }}>
              ⚡ Cargar archivo de Predicciones
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
              />
            </label>
            <button onClick={clearAll} style={{ background: 'none', border: 'none', color: '#ff453a', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>
              Limpiar listado completo
            </button>
          </div>
        )}

        <h2 style={{ textAlign: 'center', margin: '0 0 20px 0', fontSize: '22px', color: '#fff' }}>📈 Panel de Inversión Deportiva</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {predictions.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#72768d', padding: '40px 0' }}>No hay alertas activas en este bloque.</p>
          ) : (
            predictions.map((p) => (
              <div key={p.id} style={{ background: '#16181f', padding: '16px', borderRadius: '12px', border: '1px solid #252836' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', backgroundColor: '#252836', padding: '3px 8px', borderRadius: '4px', color: '#00df9a' }}>
                    {p.deporte}
                  </span>
                  <span style={{ fontSize: '11px', color: '#72768d' }}>{p.horario}</span>
                </div>
                
                <h4 style={{ margin: '5px 0', fontSize: '16px', color: '#fff' }}>{p.evento}</h4>
                <p style={{ fontSize: '13px', color: '#72768d', margin: '0 0 8px 0' }}>🏆 {p.liga}</p>
                
                <div style={{ background: '#1c1f2e', padding: '10px', borderRadius: '6px', border: '1px solid #252836', marginTop: '5px' }}>
                  <p style={{ margin: 0, color: '#00df9a', fontSize: '14px', fontWeight: 'bold' }}>
                    Sugerencia: <span style={{ color: '#fff', fontWeight: 'normal' }}>{p.prono}</span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
                }
        
