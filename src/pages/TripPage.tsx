import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Check, ChevronDown, Share, Sparkles, Star } from 'lucide-react'
import { isPermissionDenied } from '@/auth/errors'
import { useAuth } from '@/auth/AuthProvider'
import { countryLabels, plates } from '@/config/plates'
import { Button } from '@/components/ui/button'
import { ensureTripMember, joinTrip, listenEvents, listenMembers, listenTrip, togglePlate } from '@/data/trips'
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

function ShareTripButton({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const url = `${window.location.origin}/trips/${tripId}`

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setOpen(false)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={copied ? 'Copied join link' : 'Share trip'}
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex size-9 cursor-pointer items-center justify-center overflow-hidden rounded-lg text-sand-500 transition-colors hover:bg-sand-100 hover:text-forest"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={copied ? 'check' : 'share'}
            initial={{ scale: 0.45, opacity: 0, rotate: copied ? -50 : 50 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.45, opacity: 0, rotate: copied ? 50 : -50 }}
            transition={{ type: 'spring', stiffness: 520, damping: 26 }}
            className={cn('flex', copied ? 'text-forest' : null)}
          >
            {copied ? <Check className="size-4" /> : <Share className="size-4" />}
          </motion.span>
        </AnimatePresence>
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{ originX: 1, originY: 0 }}
            className="absolute right-0 top-full z-30 mt-1 min-w-36 rounded-lg border border-sand-200 bg-white py-1 shadow-sm"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => void copyLink()}
              className="flex w-full cursor-pointer px-3 py-2 text-left text-sm text-forest hover:bg-sand-50"
            >
              Share link
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function PlayingPlayers({ players }: { players: { uid: string; displayName: string }[] }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (players.length === 0) return null

  return (
    <div ref={rootRef} className="relative w-fit">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex cursor-pointer items-center gap-0.5 text-xs text-sand-500 transition-colors hover:text-forest"
      >
        {players.length} playing
        <ChevronDown className={cn('size-3 transition-transform', open ? 'rotate-180' : null)} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            role="listbox"
            aria-label="Players"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{ originX: 0, originY: 0 }}
            className="absolute left-0 top-full z-30 mt-1 min-w-44 rounded-lg border border-sand-200 bg-white py-1 shadow-sm"
          >
            {players.map((player) => (
              <div key={player.uid} className="px-3 py-2 text-sm text-forest">
                {player.displayName}
              </div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

const chipReveal = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  },
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
    <motion.span
      variants={chipReveal}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        found > 0 ? 'bg-gold/15 text-forest' : 'bg-sand-100 text-sand-500',
      )}
    >
      <span aria-hidden>{flag}</span>
      {label} {found}/{total}
    </motion.span>
  )
}

function AnimatedCount({ value }: { value: number }) {
  const reduceMotion = useReducedMotion()
  const motionValue = useMotionValue(reduceMotion ? value : 0)
  const [shown, setShown] = useState(reduceMotion ? value : 0)

  useMotionValueEvent(motionValue, 'change', (latest) => {
    setShown(Math.round(latest))
  })

  useEffect(() => {
    if (reduceMotion) {
      setShown(value)
      return
    }
    const controls = animate(motionValue, value, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    })
    return () => controls.stop()
  }, [motionValue, reduceMotion, value])

  return <>{shown}</>
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
  const reduceMotion = useReducedMotion()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  const [expandedHeight, setExpandedHeight] = useState(0)
  const pct = usaTotal === 0 ? 0 : Math.min(100, (usaFound / usaTotal) * 100)
  const complete = usaFound >= usaTotal && usaTotal > 0

  useLayoutEffect(() => {
    if (stuck) return
    const node = stickyRef.current
    if (!node) return
    setExpandedHeight(node.offsetHeight)
  }, [stuck, usaFound, usaTotal, extra])

  useEffect(() => {
    const sentinel = sentinelRef.current
    const sticky = stickyRef.current
    if (!sentinel || !sticky) return

    let frame = 0
    function update() {
      frame = 0
      const stickyTop = sticky.getBoundingClientRect().top
      const sentinelTop = sentinel.getBoundingClientRect().top
      setStuck((prev) => (prev ? sentinelTop < 40 : stickyTop <= 0))
    }
    function onScroll() {
      if (frame) return
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  const spacer = stuck ? Math.max(0, expandedHeight - 52) : 0

  return (
    <>
      <div ref={sentinelRef} className="mt-3 h-0" aria-hidden />
      <div
        ref={stickyRef}
        className={cn(
          'sticky top-0 z-20',
          stuck
            ? 'ml-[calc(50%-50vw)] w-screen max-w-[100vw] border-b border-sand-200 bg-paper/95 shadow-[0_8px_16px_-12px_rgba(28,25,23,0.35)] backdrop-blur'
            : 'w-full rounded-xl border border-sand-200 bg-white p-4 shadow-sm',
        )}
      >
        <div className={cn(stuck && 'mx-auto max-w-3xl px-4 py-2.5')}>
        <div className={cn('flex gap-3', stuck ? 'w-full items-center' : 'flex-col')}>
          <div className={cn('flex justify-between gap-3', stuck ? 'shrink-0 items-baseline' : 'items-end')}>
            <div>
              <p className={cn('font-brand tracking-wide text-forest', stuck ? 'text-xl' : 'text-3xl')}>
                <AnimatedCount value={usaFound} />
                <span className={cn('ml-1 font-normal text-sand-400', stuck ? 'text-sm' : 'text-lg')}>
                  of {usaTotal}
                </span>
              </p>
              {!stuck ? (
                <p className="text-sm text-sand-500">{complete ? 'Every US plate spotted' : 'US plates spotted'}</p>
              ) : null}
            </div>
            {!stuck ? (
              <p className="text-right text-xs text-sand-400">
                {complete ? 'Set complete' : `${usaTotal - usaFound} to go`}
              </p>
            ) : null}
          </div>
          <div
            className={cn('overflow-hidden rounded-full bg-sand-100', stuck ? 'h-1.5 min-w-0 flex-1' : 'h-2')}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={usaTotal}
            aria-valuenow={usaFound}
            aria-label="US plates spotted"
          >
            <motion.div
              className="h-full rounded-full bg-forest"
              initial={reduceMotion ? false : { width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: reduceMotion ? 0 : 0.12 }}
            />
          </div>
          {stuck && extra.points > 0 ? (
            <span className="shrink-0 text-xs font-semibold text-gold">+{extra.points}</span>
          ) : null}
        </div>
        <AnimatePresence initial={false}>
          {!stuck ? (
            <motion.div
              key="score-chips"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <motion.div
                className="mt-3 flex flex-wrap items-center gap-2"
                initial={reduceMotion ? false : 'hidden'}
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
                }}
              >
                <ExtraCreditChip flag="🇨🇦" label="Canada" found={extra.canada} total={canadaTotal} />
                <ExtraCreditChip flag="🇲🇽" label="Mexico" found={extra.mexico} total={mexicoTotal} />
                {extra.points > 0 ? (
                  <motion.span
                    variants={chipReveal}
                    className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-xs font-semibold text-gold"
                  >
                    <Sparkles className="size-3" />
                    +{extra.points} bonus
                  </motion.span>
                ) : (
                  <motion.span variants={chipReveal} className="text-[11px] text-sand-400">
                    rare plates score more
                  </motion.span>
                )}
                {extra.rareFinds > 0 ? (
                  <motion.span variants={chipReveal} className="text-[11px] font-medium text-gold">
                    {extra.rareFinds} rare
                  </motion.span>
                ) : null}
                {extra.northAmerica ? (
                  <motion.span
                    variants={chipReveal}
                    className="rounded-full bg-forest px-2.5 py-1 text-xs font-semibold text-white"
                  >
                    North America
                  </motion.span>
                ) : extra.bothBorders ? (
                  <motion.span
                    variants={chipReveal}
                    className="rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-white"
                  >
                    Both borders
                  </motion.span>
                ) : null}
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
        </div>
      </div>
      {spacer > 0 ? <div style={{ height: spacer }} aria-hidden /> : null}
    </>
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

function playerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const letters = (word: string) => Array.from(word)
  if (parts.length === 1) {
    return letters(parts[0]).slice(0, 2).join('').toUpperCase()
  }
  const first = letters(parts[0])[0] ?? ''
  const last = letters(parts[parts.length - 1])[0] ?? ''
  return `${first}${last}`.toUpperCase()
}

function FinderMark({
  foundBy,
  extraCredit,
  onOpenChange,
}: {
  foundBy: string
  extraCredit?: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const initials = playerInitials(foundBy)

  function show(next: boolean) {
    setOpen(next)
    onOpenChange(next)
  }

  return (
    <span
      className="absolute bottom-1 right-1 z-10 inline-flex items-center gap-0.5 rounded-md bg-forest/15 px-1 py-0.5 text-[10px] font-semibold leading-none tracking-wide text-forest"
      aria-label={`Found by ${foundBy}`}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        show(!open)
      }}
      onMouseEnter={() => show(true)}
      onMouseLeave={() => show(false)}
    >
      {extraCredit ? <Star className="size-2.5 fill-gold text-gold" /> : null}
      {initials}
      {open ? (
        <span
          role="tooltip"
          className="absolute bottom-[calc(100%+8px)] right-0 z-20 w-max rounded-md bg-ink px-2.5 py-1.5 text-left text-xs font-normal normal-case tracking-normal text-white shadow-md"
        >
          Found by {foundBy}
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
      onClick={
        readOnly
          ? undefined
          : (event) => {
              if (event.detail > 1) return
              onToggle()
            }
      }
      aria-label={foundBy ? `${name}, found by ${foundBy}` : name}
      className={cn(
        'relative min-h-14 w-full rounded-lg border px-2 py-3 text-center text-sm font-medium transition-colors',
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
        <FinderMark foundBy={foundBy} extraCredit={extraCredit} onOpenChange={setHint} />
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
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: 0.018, delayChildren: 0.05 },
        },
      }}
    >
      {plates[country].map((plate) => {
        const hit = found.get(plateKey(country, plate.name))
        return (
          <motion.div
            key={plate.name}
            variants={
              reduceMotion
                ? undefined
                : {
                    hidden: { opacity: 0, y: 12 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
                    },
                  }
            }
          >
            <PlateTile
              name={plate.name}
              foundBy={hit?.playerName}
              readOnly={!live}
              extraCredit={extraCredit}
              rarity={plateRarity(country, plate.name)}
              points={extraCreditPoints(country, plate.name)}
              foundPercent={plateFoundPercent(country, plate.name)}
              onToggle={() => onToggle(country, plate.name)}
            />
          </motion.div>
        )
      })}
    </motion.div>
  )
}

export function TripPage() {
  const { tripId } = useParams()
  const { profile } = useAuth()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [tripReady, setTripReady] = useState(false)
  const [eventsReady, setEventsReady] = useState(false)
  const [members, setMembers] = useState<TripMember[]>([])
  const [events, setEvents] = useState<PlateEvent[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const pendingToggles = useRef(new Set<string>())
  const memberBackfillKey = useRef<string | null>(null)

  useEffect(() => {
    if (!tripId) return
    setTripReady(false)
    setEventsReady(false)
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
    const stopEvents = listenEvents(
      tripId,
      (next) => {
        setEvents(next)
        setEventsReady(true)
      },
      () => setEventsReady(true),
    )
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
  const isMember = Boolean(profile && trip?.memberUids.includes(profile.uid))
  const listedWithGroup = Boolean(profile && members.some((member) => member.uid === profile.uid))
  const players = useMemo(() => {
    const byUid = new Map<string, string>()
    for (const member of members) {
      if (!member.uid || !member.displayName) continue
      byUid.set(member.uid, member.displayName)
    }
    if (profile && isMember && !byUid.has(profile.uid) && profile.displayName) {
      byUid.set(profile.uid, profile.displayName)
    }
    return [...byUid.entries()].map(([uid, displayName]) => ({ uid, displayName }))
  }, [members, profile, isMember])

  useEffect(() => {
    if (!tripId || !profile || !isMember || listedWithGroup) return
    const key = `${tripId}:${profile.uid}`
    if (memberBackfillKey.current === key) return
    memberBackfillKey.current = key
    void ensureTripMember(tripId, profile).catch(() => {
      // Permission errors would otherwise retry forever via snapshot flicker.
    })
  }, [tripId, profile, isMember, listedWithGroup])

  async function onJoin() {
    if (!tripId || !profile || joining) return
    setJoining(true)
    setJoinError(null)
    try {
      await joinTrip(tripId, profile)
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Could not join this trip.')
    } finally {
      setJoining(false)
    }
  }

  async function onToggle(country: Country, state: string) {
    if (!tripId || !profile || !live || !isMember) return
    const key = plateKey(country, state)
    if (pendingToggles.current.has(key)) return
    pendingToggles.current.add(key)
    const currentlyFound = found.has(key)
    try {
      await togglePlate({ tripId, currentlyFound, country, state, player: profile })
      setToggleError(null)
    } catch (err) {
      if (isPermissionDenied(err)) {
        try {
          await joinTrip(tripId, profile)
          await togglePlate({ tripId, currentlyFound, country, state, player: profile })
          setToggleError(null)
          return
        } catch (retryErr) {
          setToggleError(retryErr instanceof Error ? retryErr.message : 'Could not update that plate.')
          return
        }
      }
      setToggleError(err instanceof Error ? err.message : 'Could not update that plate.')
    } finally {
      pendingToggles.current.delete(key)
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

  if (!tripReady || !eventsReady) {
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

  if (!isMember) {
    return (
      <div className="flex flex-col gap-3">
        <BackToTrips />
        <h1 className="font-brand text-2xl tracking-wide text-forest">{trip.name}</h1>
        <PlayingPlayers players={players} />
        {trip.startDate && trip.endDate ? (
          <p className="text-sm text-sand-500">
            {dayjs(trip.startDate).format('MMM D, YYYY')} – {dayjs(trip.endDate).format('MMM D, YYYY')}
          </p>
        ) : null}
        {live ? (
          <>
            <p className="text-sand-600">Join this trip to hunt plates with the family.</p>
            {joinError ? <p className="text-sm text-red-700">{joinError}</p> : null}
            <Button className="mt-1 w-fit" onClick={() => void onJoin()} disabled={joining}>
              {joining ? 'Joining…' : 'Join this trip'}
            </Button>
          </>
        ) : (
          <p className="rounded-lg border border-sand-200 bg-sand-50 px-3 py-2 text-sm text-sand-600">
            This trip has ended and can no longer be joined.
          </p>
        )}
      </div>
    )
  }

  return (
    <div>
      <div>
        <BackToTrips />
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-brand text-2xl tracking-wide text-forest">{trip.name}</h1>
          {live ? <ShareTripButton tripId={trip.id} /> : null}
        </div>
        <PlayingPlayers players={players} />
      </div>

      <PlateScore
        usaFound={usaFound}
        usaTotal={plates.usa.length}
        extra={extra}
        canadaTotal={plates.canada.length}
        mexicoTotal={plates.mexico.length}
      />

      {!live ? (
        <p className="mt-3 rounded-lg border border-sand-200 bg-sand-50 px-3 py-2 text-sm text-sand-600">
          This trip has ended. You can look back, but plates can no longer be changed.
        </p>
      ) : null}
      {toggleError ? <p className="mt-2 text-sm text-red-700">{toggleError}</p> : null}

      <section className="mt-8">
        <h2 className="mb-1 text-lg font-semibold">{countryLabels.usa}</h2>
        <RarityLegend />
        <PlateGrid country="usa" found={found} live={live} onToggle={(country, state) => void onToggle(country, state)} />
      </section>

      <section className="mt-8 flex flex-col gap-6 rounded-xl border border-sand-200 bg-white p-4 shadow-sm">
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

      <details className="mt-8 group rounded-xl border border-sand-200 bg-white">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <h2 className="text-lg font-semibold">Timeline</h2>
          <span className="text-sm font-normal text-sand-500">
            {timeline.length === 0
              ? 'No finds yet'
              : `${timeline.length} ${timeline.length === 1 ? 'event' : 'events'}`}
          </span>
          <ChevronDown className="ml-auto size-4 text-sand-400 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-sand-100 px-4 py-3">
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
        </div>
      </details>
    </div>
  )
}
