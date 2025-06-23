const getEnvVariable = (key) => {
  // For Vite
  if (import.meta?.env) {
    return import.meta.env[`VITE_${key}`];
  }
  // For Create React App
  if (window.ENV) {
    return window.ENV[key];
  }
  // Fallback
  return "";
};

export const AUTH_CONFIG = {
  CLIENT_ID: import.meta.env.VITE_42_CLIENT_ID,
  REDIRECT_URI: import.meta.env.VITE_42_REDIRECT_URI,
  VITE_API_URL: import.meta.env.VITE_API_URL,
};
// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import path from 'path';

// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       '@': path.resolve(__dirname, './src'),
//     },
//   },
//   assetsInclude: ['**/*.gif', '**/*.jpg', '**/*.png'],
// });

export const API_BASE_URL = `https://${window.location.host}/api`;
export const WS_BASE_URL = `wss://${window.location.host}/ws`;


