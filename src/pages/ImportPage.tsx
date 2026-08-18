import { useState } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { importLegacyGames } from '@/data/trips'

export function ImportPage() {
  const { profile } = useAuth()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onImport() {
    if (!profile) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const count = await importLegacyGames(profile)
      setMessage(
        count === 0
          ? 'No new games to import. Either they are already in or the old games collection is empty.'
          : `Imported ${count} past game${count === 1 ? '' : 's'} as your trips.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <h1 className="text-2xl font-semibold">Import old games</h1>
      <p className="text-sm text-stone-600">
        Copies license-plate games from the old app into past trips. Every imported plate is attributed to you.
        Safe to run more than once.
      </p>
      <Button onClick={() => void onImport()} disabled={busy}>
        Import past games
      </Button>
      {message && <p className="text-sm text-emerald-800">{message}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  )
}
