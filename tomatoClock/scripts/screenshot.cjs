const puppeteer = require('puppeteer-core')
const http = require('http')
const fs = require('fs')
const path = require('path')

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const DOCS = 'E:\\WorkBuddyPRJ\\软件项目\\docs'
const OUT = 'E:\\WorkBuddyPRJ\\软件项目\\tomatoClock\\docs\\screenshots'
const PORT = 8765

// 启动静态文件服务器
const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0].split('#')[0]
  if (urlPath === '/') urlPath = '/index.html'
  const filePath = path.join(DOCS, urlPath)
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404)
      res.end('Not found')
      return
    }
    const ext = path.extname(filePath)
    const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' }
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' })
    res.end(data)
  })
})

async function main() {
  await new Promise((r) => server.listen(PORT, r))
  console.log('服务器已启动')

  const browser = await puppeteer.launch({
    executablePath: EDGE,
    headless: true,
    args: ['--disable-gpu', '--no-sandbox']
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })

  // 捕获控制台错误
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text())
  })
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message))

  const pages = [
    { name: '01-focus', hash: '#/' },
    { name: '02-stats', hash: '#/stats' },
    { name: '03-garden', hash: '#/garden' },
    { name: '04-settings', hash: '#/settings' }
  ]

  for (const p of pages) {
    await page.goto(`http://localhost:${PORT}/${p.hash}`, { waitUntil: 'networkidle0', timeout: 15000 })
    await new Promise((r) => setTimeout(r, 2000))
    await page.screenshot({ path: path.join(OUT, `${p.name}.png`), fullPage: false })
    console.log(`已生成: ${p.name}.png`)
  }

  await browser.close()
  server.close()
  console.log('完成')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
