import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
        <p>
          <span className="font-medium text-foreground">UI確認用デモ</span>
          {'：問題・正答率・履歴はサンプルです。正式な過去問ではありません。'}
        </p>
        <div className="flex items-center gap-4">
          <Link href="/progress#rules" className="underline-offset-4 hover:text-foreground hover:underline">
            認定ルール
          </Link>

        </div>
      </div>
    </footer>
  )
}
