import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { ArrowLeft, Check, Copy, Sparkles, Star } from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'
import { countryLabels, plates } from '@/config/plates'
import { Button } from '@/components/ui/button'
import { listenEvents, listenMembers, listenTrip, togglePlate } from '@/data/trips'
import {
  extraCreditPoints,
  extraCreditRarity,
  plateFoundPercent,
  plateRarity,
  summarizeExtraCredit,
  type ExtraCreditSummary,
  type ExtraRarity,
} from '@/domain/extra-credit'
import { countFoundByCountry, plateKey, projectFoundPlates, type Country, type FoundPlate, type PlateEvent } from '@/domain/plates'
import { isTripLive, type Trip, type TripMember } from '@/domain/trip'
import { cn } from '@/lib/utils'

function BackToTrips() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-3 w-fit text-sand-600">
      <Link to="/">
        <ArrowLeft />
        Back to trips
      </Link>
    </Button>
  )
}

function CopyJoinCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={copied ? 'Copied join code' : 'Copy join code'}
      className="mt-2 flex w-full cursor-pointer items-center gap-1 rounded-lg bg-sand-100 py-1 pl-3 pr-1 text-left transition-colors hover:bg-sand-200"
    >
      <span className="flex-1 font-mono text-lg tracking-widest">{code}</span>
      <span className="flex size-9 shrink-0 items-center justify-center text-sand-600 [&_svg]:size-4">
        {copied ? <Check /> : <Copy />}
      </span>
    </button>
  )
}

function ExtraCreditChip({
  flag,
  label,
  found,
  total,
}: {
  flag: string
  label: string
  found: number
  total: number
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        found > 0 ? 'bg-gold/15 text-forest' : 'bg-sand-100 text-sand-500',
      )}
    >
      <span aria-hidden>{flag}</span>
      {label} {found}/{total}
    </span>
  )
}

function PlateScore({
  usaFound,
  usaTotal,
  extra,
  canadaTotal,
  mexicoTotal,
}: {
  usaFound: number
  usaTotal: number
  extra: ExtraCreditSummary
  canadaTotal: number
  mexicoTotal: number
}) {
  const pct = usaTotal === 0 ? 0 : Math.min(100, (usaFound / usaTotal) * 100)
  const complete = usaFound >= usaTotal && usaTotal > 0

  return (
    <div className="mt-3 rounded-xl border border-sand-200 bg-white p-4 shadow-sm">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-brand text-3xl tracking-wide text-forest">
            {usaFound}
            <span className="ml-1 text-lg font-normal text-sand-400">of {usaTotal}</span>
          </p>
          <p className="text-sm text-sand-500">{complete ? 'Every US plate spotted' : 'US plates spotted'}</p>
        </div>
        <p className="text-right text-xs text-sand-400">
          {complete ? 'Set complete' : `${usaTotal - usaFound} to go`}
        </p>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-sand-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={usaTotal}
        aria-valuenow={usaFound}
        aria-label="US plates spotted"
      >
        <div
          className="h-full rounded-full bg-forest transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ExtraCreditChip flag="🇨🇦" label="Canada" found={extra.canada} total={canadaTotal} />
        <ExtraCreditChip flag="🇲🇽" label="Mexico" found={extra.mexico} total={mexicoTotal} />
        {extra.points > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold">
            <Sparkles className="size-3" />
            +{extra.points} bonus
          </span>
        ) : (
          <span className="text-[11px] text-sand-400">rare plates score more</span>
        )}
        {extra.rareFinds > 0 ? (
          <span className="text-[11px] font-medium text-gold">
            {extra.rareFinds} rare
          </span>
        ) : null}
        {extra.northAmerica ? (
          <span className="rounded-full bg-forest px-2.5 py-1 text-xs font-semibold text-white">
            North America
          </span>
        ) : extra.bothBorders ? (
          <span className="rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-white">
            Both borders
          </span>
        ) : null}
      </div>
    </div>
  )
}

const rarityLabel: Record<ExtraRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
}

const rarityMark: Record<ExtraRarity, string> = {
  common: 'bg-rarity-common',
  uncommon: 'bg-rarity-uncommon',
  rare: 'bg-rarity-rare',
}

const rarityText: Record<ExtraRarity, string> = {
  common: 'text-rarity-common',
  uncommon: 'text-rarity-uncommon',
  rare: 'text-rarity-rare',
}

function RarityLegend() {
  return (
    <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-sand-500">
      {(['common', 'uncommon', 'rare'] as const).map((rarity) => (
        <span key={rarity} className="inline-flex items-center gap-1.5">
          <span className={cn('size-2.5 rounded-sm', rarityMark[rarity])} />
          {rarityLabel[rarity]}
        </span>
      ))}
    </p>
  )
}

function RarityMark({
  rarity,
  points,
  foundPercent,
  extraCredit,
  onOpenChange,
}: {
  rarity: ExtraRarity
  points: number
  foundPercent: number
  extraCredit?: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const label = rarityLabel[rarity]

  function show(next: boolean) {
    setOpen(next)
    onOpenChange(next)
  }

  return (
    <span
      className={cn(
        'absolute right-0 top-0 z-10 size-[18px] rounded-bl-md rounded-tr-lg',
        rarityMark[rarity],
      )}
      aria-label={`${label} find, typically found ${foundPercent} percent of the time`}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        show(!open)
      }}
      onMouseEnter={() => show(true)}
      onMouseLeave={() => show(false)}
    >
      {open ? (
        <span
          role="tooltip"
          className="absolute bottom-[calc(100%+8px)] right-0 z-20 w-max rounded-md bg-ink px-2.5 py-1.5 text-left text-xs font-normal normal-case tracking-normal text-white shadow-md"
        >
          <span className={cn('font-semibold', rarityText[rarity])}>{label}</span> find
          <span className="mt-0.5 block text-[11px] text-white/80">Found: {foundPercent}%</span>
          {extraCredit && points ? (
            <span className="mt-0.5 block text-[11px] text-white/80">
              Worth {points} bonus {points === 1 ? 'point' : 'points'}
            </span>
          ) : null}
          <span className="absolute -bottom-1 right-2 size-2 rotate-45 bg-ink" />
        </span>
      ) : null}
    </span>
  )
}

function PlateTile({
  name,
  foundBy,
  readOnly,
  extraCredit,
  rarity,
  points,
  foundPercent,
  onToggle,
}: {
  name: string
  foundBy?: string
  readOnly: boolean
  extraCredit?: boolean
  rarity?: ExtraRarity | null
  points?: number
  foundPercent?: number
  onToggle: () => void
}) {
  const [hint, setHint] = useState(false)

  return (
    <button
      type="button"
      onClick={readOnly ? undefined : onToggle}
      className={cn(
        'relative min-h-14 rounded-lg border px-2 py-3 text-center text-sm font-medium transition-colors',
        rarity ? 'pr-6' : null,
        readOnly ? 'cursor-default' : 'cursor-pointer',
        foundBy
          ? 'border-forest/20 bg-forest/10 text-forest'
          : 'border-sand-200 bg-white text-forest',
        !readOnly && !foundBy ? 'active:bg-sand-50' : null,
        hint ? 'z-20' : null,
      )}
    >
      {rarity ? (
        <RarityMark
          rarity={rarity}
          points={points ?? 0}
          foundPercent={foundPercent ?? 0}
          extraCredit={extraCredit}
          onOpenChange={setHint}
        />
      ) : null}
      {name}
      {foundBy ? (
        <span className="mt-1 flex items-center justify-center gap-1 text-[11px] font-normal text-sand-500">
          {extraCredit ? <Star className="size-3 fill-gold text-gold" /> : null}
          {foundBy}
        </span>
      ) : null}
    </button>
  )
}

function PlateGrid({
  country,
  found,
  live,
  extraCredit,
  onToggle,
}: {
  country: Country
  found: Map<string, FoundPlate>
  live: boolean
  extraCredit?: boolean
  onToggle: (country: Country, state: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {plates[country].map((plate) => {
        const hit = found.get(plateKey(country, plate.name))
        return (
          <PlateTile
            key={plate.name}
            name={plate.name}
            foundBy={hit?.playerName}
            readOnly={!live}
            extraCredit={extraCredit}
            rarity={plateRarity(country, plate.name)}
            points={extraCreditPoints(country, plate.name)}
            foundPercent={plateFoundPercent(country, plate.name)}
            onToggle={() => onToggle(country, plate.name)}
          />
        )
      })}
    </div>
  )
}

export function TripPage() {
  const { tripId } = useParams()
  const { profile } = useAuth()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [tripReady, setTripReady] = useState(false)
  const [members, setMembers] = useState<TripMember[]>([])
  const [events, setEvents] = useState<PlateEvent[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!tripId) return
    setTripReady(false)
    setLoadError(null)
    const stopTrip = listenTrip(
      tripId,
      (next) => {
        setTrip(next)
        setTripReady(true)
      },
      setLoadError,
    )
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
  const live = trip ? isTripLive(trip) : false

  async function onToggle(country: Country, state: string) {
    if (!tripId || !profile || !live) return
    const currentlyFound = found.has(plateKey(country, state))
    try {
      await togglePlate({ tripId, currentlyFound, country, state, player: profile })
    } catch {
      // Cache miss or ended trip; the grid stays on the last known board.
    }
  }

  if (loadError && !tripReady) {
    return (
      <div className="flex flex-col gap-3">
        <BackToTrips />
        <p className="text-sand-600">Could not load this trip. {loadError}</p>
      </div>
    )
  }

  if (!tripReady) {
    return (
      <div className="flex flex-col gap-3">
        <BackToTrips />
        <p className="text-sand-500">Loading trip…</p>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="flex flex-col gap-3">
        <BackToTrips />
        <p className="text-sand-500">This trip was not found.</p>
      </div>
    )
  }

  const usaFound = countFoundByCountry(found, 'usa')
  const extra = summarizeExtraCredit(found)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <BackToTrips />
        <h1 className="text-2xl font-semibold">{trip.name}</h1>
        <PlateScore
          usaFound={usaFound}
          usaTotal={plates.usa.length}
          extra={extra}
          canadaTotal={plates.canada.length}
          mexicoTotal={plates.mexico.length}
        />
        {live ? (
          <>
            <CopyJoinCode code={trip.joinCode} />
            <p className="mt-1 text-xs text-sand-500">Share this code. Anyone signed in can join the trip.</p>
          </>
        ) : (
          <p className="mt-3 rounded-lg border border-sand-200 bg-sand-50 px-3 py-2 text-sm text-sand-600">
            This trip has ended. You can look back, but plates can no longer be changed.
          </p>
        )}
        {members.length > 0 && (
          <p className="mt-2 text-sm text-sand-500">Together: {members.map((m) => m.displayName).join(', ')}</p>
        )}
      </div>

      <section>
        <h2 className="mb-1 text-lg font-semibold">{countryLabels.usa}</h2>
        <RarityLegend />
        <PlateGrid country="usa" found={found} live={live} onToggle={(country, state) => void onToggle(country, state)} />
      </section>

      <section className="flex flex-col gap-6 rounded-xl border border-sand-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="font-brand flex items-center gap-2 text-xl tracking-wide text-forest">
            <Sparkles className="size-5 text-gold" />
            Bonus hunt
          </h2>
          <p className="mt-1 text-sm text-sand-600">
            Canadian and Mexican plates are extra credit. Far-away plates are rare and worth more.
            {extra.northAmerica
              ? ' You have spotted all three countries.'
              : extra.bothBorders
                ? ' Both borders — next up is North America.'
                : ' Spot both borders, then all three countries.'}
          </p>
          {extra.points > 0 ? (
            <p className="mt-2 font-brand text-2xl tracking-wide text-gold">+{extra.points} bonus</p>
          ) : null}
          <div className="mt-3">
            <RarityLegend />
          </div>
        </div>

        {(['canada', 'mexico'] as const).map((country) => {
          const countryFound = country === 'canada' ? extra.canada : extra.mexico
          const total = plates[country].length
          const pct = (countryFound / total) * 100
          return (
            <div key={country}>
              <div className="mb-2 flex items-end justify-between gap-3">
                <h3 className="text-lg font-semibold text-forest">
                  <span aria-hidden>{country === 'canada' ? '🇨🇦' : '🇲🇽'} </span>
                  {countryLabels[country]}
                </h3>
                <p className="text-sm text-sand-500">
                  {countryFound} of {total}
                </p>
              </div>
              <div
                className="mb-3 h-1.5 overflow-hidden rounded-full bg-sand-100"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={countryFound}
                aria-label={`${countryLabels[country]} extra-credit plates`}
              >
                <div
                  className="h-full rounded-full bg-forest transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <PlateGrid
                country={country}
                found={found}
                live={live}
                extraCredit
                onToggle={(nextCountry, state) => void onToggle(nextCountry, state)}
              />
            </div>
          )
        })}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Timeline</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-sand-500">Finds will show up here.</p>
        ) : (
          <ol className="flex flex-col gap-2 text-sm">
            {timeline.map((event) => (
              <li key={event.id} className="text-sand-700">
                <span className="text-sand-400">{dayjs(event.at).format('MMM D, h:mm A')}</span>
                {' — '}
                {event.playerName} {event.type === 'plate_found' ? 'found' : 'removed'} {event.state}
                {event.country !== 'usa' ? (
                  <span className="text-gold">
                    {' '}
                    · extra credit
                    {extraCreditRarity(event.country, event.state) === 'rare' ? ' · rare' : ''}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
