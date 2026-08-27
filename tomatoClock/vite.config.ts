import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 相对路径，确保部署到任意子路径（如 GitHub Pages 的 /tomatoClock/）都能正常加载资源
  base: './',
  // 构建产物输出到仓库根 docs/（GitHub Pages 源路径只支持 / 或 /docs）
  build: {
    outDir: '../docs'
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    open: true
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.spec.ts']
  }
})
