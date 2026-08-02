import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // GitHub Pagesはサブパス、Cloudflare Pagesは "/" でビルドする。
    base: env.VITE_BASE_PATH || '/podcast_automation_music/',
    plugins: [react()],
    build: {
      outDir: env.VITE_OUT_DIR || '../docs',
      emptyOutDir: env.VITE_OUT_DIR ? true : false,
      assetsDir: 'site-assets',
      rollupOptions: {
        output: {
          entryFileNames: 'site-assets/app.js',
          chunkFileNames: 'site-assets/[name].js',
          assetFileNames: 'site-assets/[name][extname]',
        },
      },
    },
  };
});
