import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const REQUIRED_COMMERCIAL_LEGAL_VARS = [
  'VITE_LEGAL_NAME',
  'VITE_LEGAL_ADDRESS',
  'VITE_LEGAL_REGISTRATION',
  'VITE_LEGAL_PUBLISHER',
  'VITE_PRIVACY_EMAIL',
  'VITE_DATA_HOSTING_DETAILS',
  'VITE_TRANSFER_GUARANTEES',
  'VITE_RETENTION_PROCESS',
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  if (env.VITE_COMMERCIAL_LAUNCH_ENABLED === 'true') {
    const missing = REQUIRED_COMMERCIAL_LEGAL_VARS.filter((key) => !env[key]?.trim());
    if (missing.length > 0) {
      throw new Error(`Ouverture commerciale bloquée : variables légales manquantes (${missing.join(', ')}).`);
    }
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
    },
  };
});
