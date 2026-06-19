import { datosIA } from './datos_ia.js';

// Inicializar la interfaz base
document.getElementById('app').innerHTML = `
  <div class="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-8 text-center shadow-lg">
    <h1 class="text-4xl font-black tracking-wider">PRONOS CAMILOVEN</h1>
    <p class="text-xs uppercase tracking-widest text-blue-200 mt-1">AI Premium Blue Edition</p>
  </div>

  <div class="grid grid-cols-3 gap-3 p-6 max-w-lg mx-auto">
    <button onclick="window.open('https://www.betmines.com/es','_blank')" class="bg-blue-950 text-blue-200 p-4 rounded-3xl text-center text-sm font-bold border border-blue-800 hover:bg-blue-900 transition-all">Betmines</button>
    <button onclick="window.open('https://www.forebet.com/es/predicciones','_blank')" class="bg-blue-950 text-blue-200 p-4 rounded-3xl text-center text-sm font-bold border border-blue-800 hover:bg-blue-900 transition-all">Forebet</button>
    <button onclick="window.open('https://www.adamchoi.co.uk/','_blank')" class="bg-blue-950 text-blue-200 p-4 rounded-3xl text-center text-sm font-bold border border-blue-800 hover:bg-blue-900 transition-all">AdamChoi</button>
  </div>

  <div class="px-6 max-w-lg mx-auto mb-8">
    <button class="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-3xl font-black text-lg shadow-lg shadow-blue-500/20 uppercase tracking-wider">
      📁 CARGAR NUEVO EXCEL
    </button>
  </div>

  <div class="px-6 max-w-lg mx-auto mt-4">
    <div class="bg-slate-900 border-2 border-blue-500 rounded-3xl p-6 shadow-2xl shadow-blue-500/10">
      <h3 class="text-blue-400 font-black text-xl border-b border-slate-800 pb-3 mb-4 flex items-center gap-2">
        🤖 ANÁLISIS INTELIGENTE IA
      </h3>
      <div id="contenido-ia" class="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
        Cargando datos...
      </div>
    </div>
  </div>
`;

// Inyectar las predicciones del archivo datos_ia
const cajaTexto = document.getElementById('contenido-ia');
if (cajaTexto) {
    cajaTexto.textContent = typeof datosIA !== 'undefined' ? datosIA : 'No se detectaron predicciones activas.';
}
