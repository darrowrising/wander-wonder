import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { useAuth } from '@/auth/AuthProvider'
import { countryLabels, plates } from '@/config/plates'
import { listenEvents, listenMembers, listenTrip, togglePlate } from '@/data/trips'
import { countFoundByCountry, plateKey, projectFoundPlates, type Country, type PlateEvent } from '@/domain/plates'
import type { Trip, TripMember } from '@/domain/trip'
import { cn } from '@/lib/utils'

function PlateTile({
  name,
  foundBy,
  onToggle,
}: {
  name: string
  foundBy?: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'min-h-14 cursor-pointer rounded-lg border px-2 py-3 text-center text-sm font-medium transition-colors',
        foundBy
          ? 'border-emerald-800/20 bg-emerald-800/10 text-stone-500'
          : 'border-stone-200 bg-white text-emerald-900 active:bg-stone-50',
      )}
    >
      {name}
      {foundBy ? <span className="mt-1 block text-[11px] font-normal text-stone-400">{foundBy}</span> : null}
    </button>
  )
}

export function TripPage() {
  const { tripId } = useParams()
  const { profile } = useAuth()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [members, setMembers] = useState<TripMember[]>([])
  const [events, setEvents] = useState<PlateEvent[]>([])

  useEffect(() => {
    if (!tripId) return
    const stopTrip = listenTrip(tripId, setTrip)
    const stopMembers = listenMembers(tripId, setMembers)
    const stopEvents = listenEvents(tripId, setEvents)
    return () => {
      stopTrip()
      stopMembers()
      stopEvents()
    }
  }, [tripId])

  const found = useMemo(() => projectFoundPlates(events), [events])
  const timeline = useMemo(
    () => [...events].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 40),
    [events],
  )

  async function onToggle(country: Country, state: string) {
    if (!tripId || !profile) return
    const currentlyFound = found.has(plateKey(country, state))
    await togglePlate({ tripId, currentlyFound, country, state, player: profile })
  }

  if (!trip) {
    return <p className="text-stone-500">Loading trip…</p>
  }

  const usaFound = countFoundByCountry(found, 'usa')
  const extraFound = countFoundByCountry(found, 'canada') + countFoundByCountry(found, 'mexico')

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">{trip.name}</h1>
        <p className="mt-1 text-sm text-stone-600">
          Family {usaFound} of {plates.usa.length} US plates
          {extraFound ? ` · ${extraFound} extra-credit` : ''}
        </p>
        <p className="mt-2 rounded-lg bg-stone-100 px-3 py-2 font-mono text-lg tracking-widest">
          {trip.joinCode}
        </p>
        <p className="mt-1 text-xs text-stone-500">Share this code. Anyone signed in can join the trip.</p>
        {members.length > 0 && (
          <p className="mt-2 text-sm text-stone-500">Together: {members.map((m) => m.displayName).join(', ')}</p>
        )}
      </div>

      {(['usa', 'canada', 'mexico'] as const).map((country) => (
        <section key={country}>
          <h2 className="mb-3 text-lg font-semibold">
            {countryLabels[country]}
            {country !== 'usa' ? <span className="ml-2 text-sm font-normal text-stone-400">extra credit</span> : null}
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {plates[country].map((plate) => {
              const hit = found.get(plateKey(country, plate.name))
              return (
                <PlateTile
                  key={plate.name}
                  name={plate.name}
                  foundBy={hit?.playerName}
                  onToggle={() => void onToggle(country, plate.name)}
                />
              )
            })}
          </div>
        </section>
      ))}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Timeline</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-stone-500">Finds will show up here.</p>
        ) : (
          <ol className="flex flex-col gap-2 text-sm">
            {timeline.map((event) => (
              <li key={event.id} className="text-stone-700">
                <span className="text-stone-400">{dayjs(event.at).format('MMM D, h:mm A')}</span>
                {' — '}
                {event.playerName} {event.type === 'plate_found' ? 'found' : 'removed'} {event.state}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
