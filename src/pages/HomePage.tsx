import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { backfillTripEndsAt, listenMyTrips, warmTripCache } from '@/data/trips'
import { isTripLive, type Trip } from '@/domain/trip'

function TripList({ trips, ended }: { trips: Trip[]; ended?: boolean }) {
  if (trips.length === 0) {
    return <p className="text-sm text-sand-500">None yet.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {trips.map((trip) => (
        <Link key={trip.id} to={`/trips/${trip.id}`}>
          <Card className="transition-colors hover:border-forest/40">
            <CardTitle>{trip.name}</CardTitle>
            <CardDescription>
              {trip.startDate && trip.endDate
                ? `${dayjs(trip.startDate).format('MMM D, YYYY')} – ${dayjs(trip.endDate).format('MMM D, YYYY')}`
                : 'Dates not set'}
              {ended ? ' · view only' : ` · code ${trip.joinCode}`}
            </CardDescription>
          </Card>
        </Link>
      ))}
    </div>
  )
}

export function HomePage() {
  const { profile } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return
    setLoadState('loading')
    setError(null)
    return listenMyTrips(
      profile.uid,
      (next) => {
        setTrips(next)
        setLoadState('ready')
        for (const trip of next) {
          void backfillTripEndsAt(trip, profile.uid)
        }
      },
      (message) => {
        setError(message)
        setLoadState((prev) => (prev === 'ready' ? prev : 'error'))
      },
    )
  }, [profile])

  const { current, past } = useMemo(() => {
    return {
      current: trips.filter((trip) => isTripLive(trip)),
      past: trips.filter((trip) => !isTripLive(trip)),
    }
  }, [trips])

  const currentIds = useMemo(
    () =>
      trips
        .filter((trip) => isTripLive(trip))
        .map((trip) => trip.id)
        .sort()
        .join(','),
    [trips],
  )

  useEffect(() => {
    if (!currentIds) return
    const stops = currentIds.split(',').map((id) => warmTripCache(id))
    return () => {
      for (const stop of stops) stop()
    }
  }, [currentIds])

  if (loadState === 'loading') {
    return <p className="text-sand-500">Loading trips…</p>
  }

  if (loadState === 'error') {
    return (
      <p className="text-sand-600">
        Could not load trips. {error}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/trips/new">New trip</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/join">Join with a code</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link to="/import">Import old games</Link>
        </Button>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Current trips</h2>
        <TripList trips={current} />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Past trips</h2>
        <TripList trips={past} ended />
      </section>
    </div>
  )
}
