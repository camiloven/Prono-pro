#!/bin/bash
echo "[+] Iniciando el análisis de imágenes..."
python bot_futbol.py

if [ -f "src/datos_ia.js" ]; then
    echo "[+] Enviando actualizaciones a GitHub..."
    git add src/main.js src/datos_ia.js
    git commit -m "Fusión nativa IA con JS $(date +'%Y-%m-%d %H:%M')"
    git push origin main
    echo "[+] ¡Todo listo! GitHub actualizado con éxito."
else
    echo "[-] Error: No se pudo generar el archivo nativo JavaScript."
fi
