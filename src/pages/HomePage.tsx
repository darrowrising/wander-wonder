import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { listenMyTrips } from '@/data/trips'
import type { Trip } from '@/domain/trip'

function isCurrent(trip: Trip) {
  if (!trip.endDate) return true
  return dayjs(trip.endDate).endOf('day').isAfter(dayjs().startOf('day'))
}

function TripList({ trips }: { trips: Trip[] }) {
  if (trips.length === 0) {
    return <p className="text-sm text-stone-500">None yet.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {trips.map((trip) => (
        <Link key={trip.id} to={`/trips/${trip.id}`}>
          <Card className="transition-colors hover:border-emerald-700/40">
            <CardTitle>{trip.name}</CardTitle>
            <CardDescription>
              {trip.startDate && trip.endDate
                ? `${dayjs(trip.startDate).format('MMM D, YYYY')} – ${dayjs(trip.endDate).format('MMM D, YYYY')}`
                : 'Dates not set'}
              {' · '}
              code {trip.joinCode}
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

  useEffect(() => {
    if (!profile) return
    return listenMyTrips(profile.uid, setTrips)
  }, [profile])

  const { current, past } = useMemo(() => {
    return {
      current: trips.filter(isCurrent),
      past: trips.filter((trip) => !isCurrent(trip)),
    }
  }, [trips])

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
        <TripList trips={past} />
      </section>
    </div>
  )
}
