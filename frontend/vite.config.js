import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// "/api/..." is forwarded to FastAPI, so there are no CORS problems in development
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": { target: "http://127.0.0.1:8000", rewrite: (p) => p.replace(/^\/api/, "") },
    },
  },
});
