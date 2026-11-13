/**
 * GitHub Pages 用に静的ファイルとして書き出す。
 * 公開URLはリポジトリ名のパス配下になるため、ビルド時に PAGES_BASE_PATH（例：/quizARCHIVE）を渡す。
 * 開発時（pnpm dev）は未設定でよい。
 */
const basePath = process.env.PAGES_BASE_PATH ?? ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
