import type { Metadata, Viewport } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import './globals.css'
import { Suspense } from 'react'
import { DemoControlsLoader } from '@/components/demo/demo-controls-loader'
import { ApiRevalidator } from '@/components/api-revalidator'
import { themeInitScript } from '@/lib/theme'

/** GitHub Pages ではリポジトリ名のパス配下で公開するため、静的ファイルのURLに付ける */
const basePath = process.env.PAGES_BASE_PATH ?? ''

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: {
    default: '毎日宇宙クイズ 過去問 | Cosmo Base',
    template: '%s | 毎日宇宙クイズ 過去問',
  },
  description: '気になる問題から、宇宙をもっと知ろう。Cosmo Base の「毎日宇宙クイズ」の過去問で、練習・テストに挑戦できます。',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: `${basePath}/icon-light-32x32.png`, media: '(prefers-color-scheme: light)' },
      { url: `${basePath}/icon-dark-32x32.png`, media: '(prefers-color-scheme: dark)' },
    ],
    apple: `${basePath}/apple-icon.png`,
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f7fc' },
    { media: '(prefers-color-scheme: dark)', color: '#000033' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${notoSansJp.variable} bg-background`} suppressHydrationWarning>
      <head>
        {/* 端末の設定・保存した選択に合わせて、描画の前にダークモードを決める */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        <ApiRevalidator />
        {children}
        <Suspense fallback={null}>
          <DemoControlsLoader />
        </Suspense>
      </body>
    </html>
  )
}
