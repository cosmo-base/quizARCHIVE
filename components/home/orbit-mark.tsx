/** ホーム用の小さな軌道と星の装飾 */
export function OrbitMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 240" fill="none" aria-hidden="true" className={className}>
      <ellipse cx="200" cy="120" rx="150" ry="70" transform="rotate(-18 200 120)" stroke="currentColor" strokeOpacity="0.16" />
      <ellipse cx="200" cy="120" rx="100" ry="46" transform="rotate(-18 200 120)" stroke="currentColor" strokeOpacity="0.22" />
      <circle cx="200" cy="120" r="14" fill="currentColor" fillOpacity="0.14" />
      <circle cx="200" cy="120" r="6" fill="currentColor" fillOpacity="0.5" />
      <circle cx="294" cy="88" r="5" fill="currentColor" />
      <circle cx="116" cy="166" r="3.5" fill="currentColor" fillOpacity="0.6" />
      <path d="M86 52l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="currentColor" fillOpacity="0.45" />
      <path d="M262 192l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z" fill="currentColor" fillOpacity="0.35" />
    </svg>
  )
}
