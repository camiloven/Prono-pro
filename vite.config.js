import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Prono Pro",
        short_name: "PronoPro",
        description: "App de predicciones deportivas",
        theme_color: "#0a0a0f",
        background_color: "#0a0a0f",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "https://via.placeholder.com/192", sizes: "192x192", type: "image/png" },
          { src: "https://via.placeholder.com/512", sizes: "512x512", type: "image/png" }
        ]
      }
    })
  ]
});
