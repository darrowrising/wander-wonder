import { useOnline } from '@/lib/online'

export function OfflineBanner() {
  const online = useOnline()
  if (online) return null

  return (
    <p className="border-b border-sand-200 bg-sand-100 px-4 py-2 text-center text-sm text-sand-700">
      You’re offline. Finds will sync when you’re back.
    </p>
  )
}
