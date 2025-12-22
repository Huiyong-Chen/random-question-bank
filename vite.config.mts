import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const isAnalyze = process.env.ANALYZE === 'true'

const aliasFromRoot = (dir: string) => resolve(rootDir, dir)

export default defineConfig({
  plugins: [
    react(),
    ...(isAnalyze
      ? [
          visualizer({
            filename: 'dist/stats.html',
            gzipSize: true,
            brotliSize: true,
            template: 'treemap',
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@components': aliasFromRoot('src/components'),
      '@hooks': aliasFromRoot('src/hooks'),
      '@pages': aliasFromRoot('src/pages'),
      '@services': aliasFromRoot('src/services'),
      '@/types': aliasFromRoot('src/types'),
      '@utils': aliasFromRoot('src/utils'),
      '@i18n': aliasFromRoot('src/i18n'),
    },
  },
  envPrefix: 'VITE_',
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          docx: ['docx'],
        },
      },
    },
  },
})
