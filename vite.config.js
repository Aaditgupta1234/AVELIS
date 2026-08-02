import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // ─── Bundle chunk splitting ──────────────────────────────────────────────
  // Without manualChunks Rollup may co-bundle @splinetool/runtime (~2 MB JS)
  // into the landing-page entry chunk.  Splitting it out means:
  //   • The entry chunk is ~550 KB smaller (gzip), so FCP and TTI are earlier.
  //   • The spline-vendor chunk is only fetched when React.lazy() triggers it
  //     — which, after Phase 3.1, happens only after requestIdleCallback fires.
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Spline runtime is a ~2 MB monolith that cannot be tree-shaken.
          // Keep it isolated so it never blocks the landing-page parse.
          if (id.includes('@splinetool')) return 'spline-vendor';

          // Three.js is pulled in by the restyleScene helper.
          // Separating it avoids it landing in the entry chunk too.
          if (id.includes('/three/') || id.includes('\\three\\')) return 'three-vendor';
        },
      },
    },
  },

  server: {
    watch: {
      ignored: ['**/server/data/**', '**/server/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})

