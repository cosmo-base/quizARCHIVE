import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import './globals.css'
import { DemoControls } from '@/components/demo/demo-controls'

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: {
    default: '宇宙クイズ | Cosmo Base',
    template: '%s | 宇宙クイズ',
  },
  description: '気になる問題から、宇宙をもっと知ろう。Cosmo Base の宇宙クイズで練習・テストに挑戦できます。',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f6f7fb',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${notoSansJp.variable} bg-background`}>
      <body className="min-h-dvh font-sans antialiased">
        {children}
        <DemoControls />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
