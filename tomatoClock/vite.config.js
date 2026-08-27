import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 相对路径，确保部署到任意子路径（如 GitHub Pages 的 /tomatoClock/）都能正常加载资源
  base: './',
  // 构建产物输出到 docs/，配合 GitHub Pages「Deploy from a branch」模式免服务器托管
  build: {
    outDir: 'docs'
  },
  plugins: [vue()],
  server: {
    port: 5173,
    open: true
  }
})
