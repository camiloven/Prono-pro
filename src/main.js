import './style.css'

// Importamos la predicción nativa directamente como un archivo de código
import { prediccionesIA } from './datos_ia.js'

const appDiv = document.querySelector('#app');

// Formateamos el texto convirtiendo los saltos de línea y negritas en etiquetas HTML
const contenidoFormateado = prediccionesIA
  .replace(/\n/g, '<br>')
  .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #ffcc00;">$1</strong>');

// Pintamos toda la interfaz nativa con los datos inyectados directamente
appDiv.innerHTML = `
  <section id="center">
    <div class="hero" style="background: linear-gradient(135deg, #ffcc00, #ff9900); padding: 30px 10px; color: #000; font-weight: bold; text-align: center; border-radius: 0 0 20px 20px;">
      <h1 style="margin: 0; font-size: 32px; font-family: 'Arial Black', sans-serif;">PRONOS CAMILOUEN</h1>
      <p style="margin: 5px 0 0 0; font-size: 14px; letter-spacing: 2px;">HIGH PROBABILITY PICKS</p>
    </div>
    
    <div style="display: flex; justify-content: center; gap: 10px; margin: 25px 0; padding: 0 10px;">
      <button class="counter">Betmines</button>
      <button class="counter">Forebet</button>
      <button class="counter">AdamChoi</button>
    </div>

    <div style="padding: 0 20px; margin-bottom: 30px; text-align: center;">
      <button class="counter" style="background: #ffcc00; color: #000; width: 100%; max-width: 400px; padding: 18px; font-size: 18px; font-weight: bold;">
        📁 CARGAR EXCEL
      </button>
    </div>

    <div style="padding: 0 20px; text-align: left; max-width: 600px; margin: 0 auto 50px auto;">
      <div style="background: #1c1c1e; border: 1px solid #ffcc00; border-radius: 15px; padding: 20px; box-shadow: 0 4px 15px rgba(255,204,0,0.1);">
        <h3 style="color: #ffcc00; margin-top: 0; font-size: 18px; border-bottom: 1px solid #333; padding-bottom: 10px;">
          🤖 Análisis Multi-Captura Realizado con Éxito
        </h3>
        <div style="font-size: 14px; color: #e0e0e0; line-height: 1.6; max-height: 400px; overflow-y: auto; padding-right: 5px;">
          ${contenidoFormateado}
        </div>
      </div>
    </div>
  </section>
`;
