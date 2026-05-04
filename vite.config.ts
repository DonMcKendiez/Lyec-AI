import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    base: '/',
    define: {
      // This prevents the "process is not defined" error in the browser
      'process.env': {}
    },
    resolve: {
      alias: {
        // Sets up the '@' alias to point to your root directory
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Ensures HMR works locally but doesn't break during production builds
      hmr: env.DISABLE_HMR !== 'true',
    },
    build: {
      // Ensures the output is placed in the 'dist' folder for Vercel
      outDir: 'dist',
    }
  };
});
