// 轻量 Service Worker：运行时缓存，使应用可离线使用（首次访问后）
// 配合 GitHub Pages 部署，base 为相对路径，SW 作用域自动为部署子路径。
const CACHE = "focus-habit-v1"
const APP_SHELL = "./index.html"

// 安装时预缓存应用入口
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.add(APP_SHELL).catch(() => {}))
  )
  self.skipWaiting()
})

// 激活时清理旧缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const req = event.request
  if (req.method !== "GET") return

  // 仅处理同源请求（避免跨域缓存干扰）
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // 导航请求：网络优先，失败回退到缓存的 index.html（离线可打开 SPA）
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(APP_SHELL, copy))
          return res
        })
        .catch(() => caches.match(APP_SHELL))
    )
    return
  }

  // 静态资源：网络优先，成功则写入缓存；失败则从缓存读取（哈希资源自动按 URL 区分）
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(req, copy))
        }
        return res
      })
      .catch(() => caches.match(req))
  )
})
