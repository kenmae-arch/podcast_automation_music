import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  base: '/podcast_automation_music/',
  plugins: [react()],
  build: {
    outDir: '../docs',
    emptyOutDir: false,
    assetsDir: 'site-assets',
    rollupOptions: {
      output: {
        entryFileNames: 'site-assets/app.js',
        chunkFileNames: 'site-assets/[name].js',
        assetFileNames: 'site-assets/[name][extname]',
      },
    },
  },
});
