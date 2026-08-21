import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { isPermissionDenied } from '@/auth/errors'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { listenGameStats, rebuildPlateStats, rebuildWildlifeStats } from '@/data/stats'
import type { GameStats, GameStatsId } from '@/domain/game-stats'

function statsSummary(stats: GameStats | null): string {
  if (!stats) return 'No stats yet.'
  const when = stats.updatedAt ? dayjs(stats.updatedAt).format('MMM D, YYYY h:mm A') : 'unknown time'
  if (stats.tripCount === 0) return `Last built ${when}. No trips had this game yet.`
  return `Last built ${when} from ${stats.tripCount} ${stats.tripCount === 1 ? 'trip' : 'trips'}.`
}

export function AdminPage() {
  const { profile } = useAuth()
  const [plateStats, setPlateStats] = useState<GameStats | null>(null)
  const [wildlifeStats, setWildlifeStats] = useState<GameStats | null>(null)
  const [busy, setBusy] = useState<GameStatsId | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stopPlates = listenGameStats('plates', setPlateStats)
    const stopWildlife = listenGameStats('wildlife', setWildlifeStats)
    return () => {
      stopPlates()
      stopWildlife()
    }
  }, [])

  async function rebuild(id: GameStatsId) {
    if (busy) return
    setBusy(id)
    setError(null)
    try {
      if (id === 'plates') await rebuildPlateStats()
      else await rebuildWildlifeStats()
    } catch (err) {
      if (isPermissionDenied(err)) {
        setError('Could not rebuild stats. Publish the latest Firestore rules so admin can list trips and write stats.')
      } else {
        setError(err instanceof Error ? err.message : 'Could not rebuild stats.')
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-sand-600">
          Signed in as {profile?.email}. This page is hidden in the app and blocked in Firestore for
          everyone else.
        </p>
      </div>

      <section className="rounded-xl border border-sand-200 bg-white p-4 shadow-sm">
        <h2 className="font-brand text-xl tracking-wide text-forest">Find rates</h2>
        <p className="mt-1 text-sm text-sand-600">
          Scan every trip and count how often each plate or animal was still found at the end.
          Games also update these rates as you play; use this to backfill history.
        </p>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-sand-500">{statsSummary(plateStats)}</p>
            <Button onClick={() => void rebuild('plates')} disabled={busy != null} className="w-fit">
              {busy === 'plates' ? 'Scanning plates…' : 'Rebuild plate stats'}
            </Button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-sand-500">{statsSummary(wildlifeStats)}</p>
            <Button onClick={() => void rebuild('wildlife')} disabled={busy != null} className="w-fit">
              {busy === 'wildlife' ? 'Scanning wildlife…' : 'Rebuild wildlife stats'}
            </Button>
          </div>
        </div>
      </section>

      <Link to="/" className="text-sm text-forest underline-offset-4 hover:underline">
        Back to trips
      </Link>
    </div>
  )
}
