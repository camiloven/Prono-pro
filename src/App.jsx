import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

const ADMIN_KEY = "JACOBO_ADMIN_2026";
const CLIENT_KEY = "PRONO_MASTER_2026";

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [inputKey, setInputKey] = useState('');
  const [role, setRole] = useState(null);
  const [error, setError] = useState('');
  
  const [predictions, setPredictions] = useState(() => {
    const saved = localStorage.getItem('prono_data_store');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const savedRole = localStorage.getItem('prono_user_role');
    if (savedRole) setRole(savedRole);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 5000);
    return () => clearTimeout(timer);
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
      setError('❌ Código de acceso incorrecto');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('prono_user_role');
    setRole(null);
    setInputKey('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const newPredictions = jsonData.map((row, index) => ({
        id: Date.now() + index,
        deporte: row.Deporte || 'Fútbol',
        evento: row.Evento || row.Partido || 'Evento no especificado',
        liga: row.Liga || 'Liga Desconocida',
        horario: row.Horario || '',
        pronoGanador: row['Pronóstico 1X2'] || row.Pronostico || 'Pendiente',
        pronoGoles: row['Pronóstico Goles'] || row.Goles || 'Pendiente',
        visible: true
      }));

      setPredictions(newPredictions);
      localStorage.setItem('prono_data_store', JSON.stringify(newPredictions));
    };
    reader.readAsArrayBuffer(file);
  };

  const toggleVisibility = (id) => {
    const updated = predictions.map(p => p.id === id ? { ...p, visible: !p.visible } : p);
    setPredictions(updated);
    localStorage.setItem('prono_data_store', JSON.stringify(updated));
  };

  const displayedPredictions = role === 'admin' ? predictions : predictions.filter(p => p.visible);

  if (showIntro) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-75"
        >
          <source src="/grok_video_2026-06-14-15-21-27.mp4" type="video/mp4" />
          Tu navegador no soporta video.
        </video>

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/80 to-black z-10"></div>

        <div className="relative z-20 text-center px-6">
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-8 py-4 rounded-3xl">
              <span className="text-6xl">⚽</span>
              <div>
                <h1 className="text-6xl font-bold tracking-tighter text-white">PRONO PRO</h1>
                <p className="text-emerald-400 text-xl">by camiloven</p>
              </div>
            </div>
          </div>
          <p className="text-white/90 text-2xl mt-4">Pronósticos Premium</p>
        </div>

        <div className="absolute bottom-12 z-20">
          <button 
            onClick={() => setShowIntro(false)}
            className="px-12 py-5 bg-white text-black font-bold rounded-2xl text-xl active:scale-95 transition-all"
          >
            ENTRAR AL PANEL
          </button>
        </div>
      </div>
    );
  }

  // ... (el resto del panel se mantiene igual)
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">
      <header className="sticky top-0 z-50 bg-[#12141b] border-b border-[#252836] px-4 py-5">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center text-2xl">📊</div>
            <div>
              <h1 className="text-3xl font-bold tracking-tighter">PRONO PRO</h1>
              <p className="text-emerald-400 text-sm -mt-1">by camiloven</p>
            </div>
          </div>
          {role && (
            <button onClick={handleLogout} className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl text-sm font-medium transition-all">Cerrar Sesión</button>
          )}
        </div>
      </header>

      {!role ? (
        <div className="flex items-center justify-center min-h-[85vh] px-4">
          <div className="w-full max-w-md bg-[#16181f] rounded-3xl p-10 border border-[#252836]">
            <div className="text-center mb-12">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-3xl flex items-center justify-center text-6xl mb-6">⚽</div>
              <h2 className="text-4xl font-bold mb-3">Prono Pro</h2>
              <p className="text-emerald-400">by camiloven</p>
            </div>
            <form onSubmit={handleLogin}>
              <input type="password" placeholder="Código de acceso" value={inputKey} onChange={(e) => setInputKey(e.target.value)} className="w-full bg-[#1e222b] border border-[#353945] rounded-2xl px-6 py-5 text-center text-lg focus:outline-none focus:border-emerald-500 mb-6" />
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-5 rounded-2xl text-lg transition-all active:scale-95">INGRESAR AL PANEL</button>
            </form>
            {error && <p className="text-red-400 text-center mt-4">{error}</p>}
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-4 py-8">
          {role === 'admin' && (
            <div className="bg-gradient-to-r from-[#1c1f2e] to-[#16181f] border border-[#353945] rounded-3xl p-8 mb-10">
              <h3 className="text-xl font-semibold mb-2 text-amber-400">📤 Cargar Pronósticos</h3>
              <label className="block cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-6 rounded-2xl text-center text-lg transition-all">
                Seleccionar Archivo Excel
                <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}
          <h2 className="text-3xl font-bold text-center mb-8">📊 Pronósticos del Día</h2>
          {displayedPredictions.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <div className="text-7xl mb-6">⚽</div>
              <p className="text-xl">No hay pronósticos cargados</p>
            </div>
          ) : (
            <div className="space-y-6">
              {displayedPredictions.map((p) => (
                <div key={p.id} className={`bg-[#16181f] border rounded-3xl p-7 transition-all hover:-translate-y-1 ${role === 'admin' && p.visible ? 'border-emerald-500' : 'border-[#252836]'}`}>
                  <div className="flex justify-between items-start mb-5">
                    <span className="px-4 py-1 bg-[#252836] text-emerald-400 text-xs font-mono rounded-full">{p.deporte}</span>
                    {role === 'admin' ? (
                      <button onClick={() => toggleVisibility(p.id)} className={`px-6 py-2 rounded-2xl text-sm ${p.visible ? 'bg-emerald-500 text-black' : 'bg-gray-700'}`}>{p.visible ? '✅ Visible' : '❌ Oculto'}</button>
                    ) : (
                      <span className="text-sm text-gray-400">{p.horario}</span>
                    )}
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">{p.evento}</h3>
                  <p className="text-gray-400 mb-6">🏆 {p.liga}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#1e2230] p-6 rounded-2xl border-l-4 border-emerald-500">
                      <p className="text-xs text-gray-500 mb-1">1X2</p>
                      <p className="text-xl font-medium">{p.pronoGanador}</p>
                    </div>
                    <div className="bg-[#1e2230] p-6 rounded-2xl border-l-4 border-amber-400">
                      <p className="text-xs text-gray-500 mb-1">GOLES</p>
                      <p className="text-xl font-medium">{p.pronoGoles}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
