import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const damlDependencies = [
  '@daml.js/utility-credential-app-v0-0.4.1',
  '@daml.js/utility-credential-v0-0.1.0',
  '@daml.js/splice-api-token-transfer-instruction-v1-1.0.0',
]

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    preserveSymlinks: true,
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './components'),
      '@repo/shadcn-ui/lib/utils': path.resolve(__dirname, './src/lib/utils'),
    },
  },
  optimizeDeps: {
    include: damlDependencies,
  },
})
