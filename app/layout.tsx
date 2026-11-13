import type { Metadata, Viewport } from 'next'
import { StoreProvider } from '@/lib/store/store'
import { Toaster } from '@/components/kit/toast'
import { AppShell } from '@/components/shell/app-shell'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cosmo Base 毎日宇宙クイズ 過去問（V0モック）',
  description: 'Cosmo Base 毎日宇宙クイズの過去問を検索・練習・テスト・振り返りできる参加者向けサイトのUIモック',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f4f6f9',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className="bg-background">
      <body className="antialiased">
        <StoreProvider>
          <AppShell>{children}</AppShell>
          <Toaster />
        </StoreProvider>
      </body>
    </html>
  )
}
