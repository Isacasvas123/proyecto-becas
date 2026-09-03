import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// La URL de la API se lee de VITE_API_URL (ver .env.example). Nada de direcciones
// quemadas en el código.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
