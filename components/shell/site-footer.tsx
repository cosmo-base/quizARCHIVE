import Image from 'next/image'
import Link from 'next/link'
import cosmoBaseLogo from '@/assets/brand/cosmo-base.png'

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex flex-col gap-2">
          <Image src={cosmoBaseLogo} alt="Cosmo Base" className="h-6 w-auto self-start" />
          <p>Cosmo Base のコンテンツ「毎日宇宙クイズ」の過去問サイトです。運営：FSIF（未来宇宙産業フォーラム）</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/progress#rules" className="underline-offset-4 hover:text-foreground hover:underline">
            認定ルール
          </Link>
          <Link href="/privacy" className="underline-offset-4 hover:text-foreground hover:underline">
            プライバシー
          </Link>
        </div>
      </div>
    </footer>
  )
}
