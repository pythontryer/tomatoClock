import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 相对路径，确保部署到任意子路径（如 GitHub Pages 的 /tomatoClock/）都能正常加载资源
  base: './',
  // 构建产物输出到仓库根 docs/（注意：GitHub Pages 源路径只支持 / 或 /docs，
  // 不支持深层子目录，故产物必须落在仓库根的 docs/；源码仍在 tomatoClock/）
  build: {
    outDir: '../docs'
  },
  plugins: [vue()],
  server: {
    port: 5173,
    open: true
  }
})
