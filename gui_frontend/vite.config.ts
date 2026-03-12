import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import checker from 'vite-plugin-checker'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    checker({
      vueTsc: true,
      eslint: {
        lintCommand: 'eslint -c ./eslint.config.js "./src*/**/*.{ts,js,mjs,cjs,vue}"',
        useFlatConfig: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      src: fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: parseInt(process.env.DEV_SERVER_PORT ?? '3000'),
    open: true,
  },
  build: {
    outDir: 'dist/spa',
    emptyOutDir: true,
  },
})
