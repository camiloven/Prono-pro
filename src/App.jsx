import React, { useState, useEffect } from 'react';

// 🔑 CONFIGURACIÓN DE CREDENCIALES
const ADMIN_KEY = "JACOBO_ADMIN_2026";      // Tu clave para editar contenido
const CLIENT_KEY = "PRONO_MASTER_2026";     // La clave que le vendes a tus clientes

export default function App() {
  const [inputKey, setInputKey] = useState('');
  const [role, setRole] = useState(null); // 'admin', 'client', o null
  const [error, setError] = useState('');
  
  // 📊 ESTADO DE LAS PREDICCIONES (Se guardan en el navegador para que no se borren)
  const [predictions, setPredictions] = useState(() => {
    const saved = localStorage.getItem('prono_data_store');
    return saved ? JSON.parse(saved) : [
      { id: 1, evento: "Real Madrid vs Manchester City", prono: "Local o Empate / Más de 1.5 goles", cuota: "1.65", estado: "Pendiente" },
      { id: 2, evento: "Boston Celtics vs Miami Heat", prono: "Celtics -4.5 Hándicap", cuota: "1.85", estado: "Pendiente" }
    ];
  });

  // Estado para el formulario de nuevo partido (Solo Administrador)
  const [newEvent, setNewEvent] = useState({ evento: '', prono: '', cuota: '', estado: 'Pendiente' });

  // Verificación automática de sesión al cargar la app
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
      setError('❌ Código incorrecto, inválido o expirado.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('prono_user_role');
    setRole(null);
    setInputKey('');
  };

  // Funciones de Administrador para gestionar la lista
  const addPrediction = (e) => {
    e.preventDefault();
    if (!newEvent.evento || !newEvent.prono) return;
    const updated = [...predictions, { ...newEvent, id: Date.now() }];
    setPredictions(updated);
    localStorage.setItem('prono_data_store', JSON.stringify(updated));
    setNewEvent({ evento: '', prono: '', cuota: '', estado: 'Pendiente' });
  };

  const deletePrediction = (id) => {
    const updated = predictions.filter(p => p.id !== id);
    setPredictions(updated);
    localStorage.setItem('prono_data_store', JSON.stringify(updated));
  };

  const toggleEstado = (id) => {
    const updated = predictions.map(p => {
      if (p.id === id) {
        const proximos = { "Pendiente": "🟢 Ganado", "🟢 Ganado": "🔴 Perdido", "🔴 Perdido": "Pendiente" };
        return { ...p, estado: proximos[p.estado] || "Pendiente" };
      }
      return p;
    });
    setPredictions(updated);
    localStorage.setItem('prono_data_store', JSON.stringify(updated));
  };

  // 1️⃣ VISTA: PANTALLA DE LOGIN UNIFICADA
  if (!role) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0d0e12', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '380px', background: '#16181f', padding: '30px 20px', borderRadius: '16px', border: '1px solid #252836', textAlign: 'center' }}>
          <h1 style={{ color: '#00df9a', margin: '0 0 5px 0', fontSize: '26px' }}>📊 PRONO PRO</h1>
          <p style={{ color: '#72768d', fontSize: '13px', marginBottom: '25px' }}>Ingresa tu token de acceso para desbloquear el panel.</p>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="password"
              placeholder="Código de Acceso"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #353945', backgroundColor: '#1e222b', color: '#fff', fontSize: '16px', boxSizing: 'border-box', textAlign: 'center' }}
            />
            <button type="submit" style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#00df9a', color: '#000', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              Validar Credencial
            </button>
          </form>
          {error && <p style={{ color: '#ff453a', fontSize: '13px', marginTop: '12px' }}>{error}</p>}
        </div>
      </div>
    );
  }

  // 2️⃣ VISTA: PANEL GENERAL (Compartido pero con condicionales de rol)
  return (
    <div style={{ backgroundColor: '#0d0e12', color: '#fff', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', padding: '15px' }}>
      
      {/* Encabezado Superior */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '600px', margin: '0 auto 20px auto', background: '#16181f', padding: '12px 20px', borderRadius: '10px', border: '1px solid #252836' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#72768d', display: 'block' }}>Sesión actual</span>
          <span style={{ color: role === 'admin' ? '#ff9f0a' : '#00df9a', fontWeight: 'bold', fontSize: '14px' }}>
            {role === 'admin' ? '⚙️ ADMINISTRADOR' : '💎 CLIENTE PREMIUM'}
          </span>
        </div>
        <button onClick={handleLogout} style={{ backgroundColor: '#ff453a', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
          Salir
        </button>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* 🛠️ MÓDULO EXCLUSIVO DE ADMINISTRADOR: Formulario para añadir datos */}
        {role === 'admin' && (
          <div style={{ background: '#1c1f2e', padding: '20px', borderRadius: '12px', border: '1px solid #353945', marginBottom: '25px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#ff9f0a' }}>Agregar Nuevo Pronóstico</h3>
            <form onSubmit={addPrediction} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="Partido / Evento (ej: Real Madrid vs Chelsea)"
                value={newEvent.evento}
                onChange={(e) => setNewEvent({...newEvent, evento: e.target.value})}
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #353945', backgroundColor: '#16181f', color: '#fff' }}
              />
              <input
                type="text"
                placeholder="Predicción (ej: Gana Local o Más de 2.5)"
                value={newEvent.prono}
                onChange={(e) => setNewEvent({...newEvent, prono: e.target.value})}
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #353945', backgroundColor: '#16181f', color: '#fff' }}
              />
              <input
                type="text"
                placeholder="Cuota (ej: 1.80)"
                value={newEvent.cuota}
                onChange={(e) => setNewEvent({...newEvent, cuota: e.target.value})}
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #353945', backgroundColor: '#16181f', color: '#fff' }}
              />
              <button type="submit" style={{ padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#ff9f0a', color: '#000', fontWeight: 'bold', cursor: 'pointer', marginTop: '5px' }}>
                📌 Publicar en la App
              </button>
            </form>
          </div>
        )}

        {/* 📈 SECCIÓN DE CONTENIDO: Lo que ven ambos, pero el admin tiene herramientas de edición */}
        <h2 style={{ textAlign: 'center', margin: '0 0 15px 0', fontSize: '22px' }}>📊 Pronósticos del Día</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {predictions.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#72768d' }}>No hay pronósticos disponibles en este momento.</p>
          ) : (
            predictions.map((p) => (
              <div key={p.id} style={{ background: '#16181f', padding: '16px', borderRadius: '12px', border: '1px solid #252836', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', maxWidth: '80%' }}>{p.evento}</h4>
                  <span 
                    onClick={() => role === 'admin' && toggleEstado(p.id)}
                    style={{ 
                      fontSize: '12px', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      background: p.estado.includes('Ganado') ? 'rgba(48,209,88,0.2)' : p.estado.includes('Perdido') ? 'rgba(255,69,58,0.2)' : 'rgba(255,159,10,0.2)',
                      color: p.estado.includes('Ganado') ? '#30d158' : p.estado.includes('Perdido') ? '#ff453a' : '#ff9f0a',
                      fontWeight: 'bold',
                      cursor: role === 'admin' ? 'pointer' : 'default'
                    }}
                  >
                    {p.estado} {role === 'admin' && '🔄'}
                  </span>
                </div>
                
                <p style={{ margin: '0 0 6px 0', color: '#00df9a', fontWeight: '500' }}>
                  Prono: <span style={{ color: '#fff' }}>{p.prono}</span>
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: '#72768d' }}>
                  Cuota estimada: <span style={{ color: '#fff', fontWeight: 'bold' }}>{p.cuota}</span>
                </p>

                {/* Botón de eliminación rápida exclusivo del Administrador */}
                {role === 'admin' && (
                  <button 
                    onClick={() => deletePrediction(p.id)}
                    style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'none', border: 'none', color: '#ff453a', fontSize: '18px', cursor: 'pointer' }}
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
        }
                  
