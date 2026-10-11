import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { cpSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// 既存の静的ファイル（script.js・pdf・画像など）は手を加えずそのまま dist にコピーする
const staticFiles = ['script.js', 'pdf', 'images', 'assets']
function copyStatic(): Plugin {
  return {
    name: 'copy-static',
    apply: 'build',
    closeBundle() {
      for (const f of staticFiles) {
        const from = resolve(__dirname, f)
        if (existsSync(from)) cpSync(from, resolve(__dirname, 'dist', f), { recursive: true })
      }
    },
  }
}

export default defineConfig({
  base: './', // GitHub Pages のサブパス（/mypage/）でもそのまま動くように
  publicDir: false,
  plugins: [react(), copyStatic()],
  build: { chunkSizeWarningLimit: 1500 },
})
