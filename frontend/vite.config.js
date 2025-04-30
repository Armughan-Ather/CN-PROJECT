import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import rollupNodePolyFill from 'rollup-plugin-polyfill-node';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['buffer', 'process'], // Needed for some node modules
  },
  define: {
    global: 'globalThis', // 👈 Polyfill global for browser
  },
  build: {
    rollupOptions: {
      plugins: [rollupNodePolyFill()],
    },
  },
});
