import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Binoculars, Car, Check, ChevronDown, Share, Sparkles, Star } from 'lucide-react'
import { isPermissionDenied } from '@/auth/errors'
import { useAuth } from '@/auth/AuthProvider'
import { countryLabels, plates } from '@/config/plates'
import { wildlifeAnimals, wildlifeById, wildlifeSigns } from '@/config/wildlife'
import { Button } from '@/components/ui/button'
import { UsaPlateMap } from '@/components/UsaPlateMap'
import { ensureTripMember, joinTrip, listenEvents, listenMembers, listenTrip, togglePlate, toggleWildlife } from '@/data/trips'
import { listenGameStats } from '@/data/stats'
import { extraCreditPoints, extraCreditRarity, plateFoundPercent, plateRarity, pointsForRarity, summarizeExtraCredit, type ExtraCreditSummary, type ExtraRarity } from '@/domain/extra-credit'
import { leadingFindCount, tallyFindsByPlayer } from '@/domain/find-tally'
import { itemFoundStat, type FoundStat, type GameStats } from '@/domain/game-stats'
import { countFoundByCountry, plateKey, projectFoundPlates, type Country, type FoundPlate } from '@/domain/plates'
import { isPlateEvent, isWildlifeEvent, type TripEvent } from '@/domain/trip-event'
import { tripShareClipboard, tripShareTitle } from '@/domain/share-trip'
import { parseTripGame, tripGameHref, type TripGame } from '@/domain/trip-game'
import { isTripActive, isTripLive, tripPlayState, type Trip, type TripMember } from '@/domain/trip'
import { projectWildlifeSightings } from '@/domain/wildlife'
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

function tripDateRange(startDate: string, endDate: string): string | undefined {
  if (!startDate || !endDate) return undefined
  const start = dayjs(startDate)
  const end = dayjs(endDate)
  if (!start.isValid() || !end.isValid()) return undefined
  if (start.isSame(end, 'day')) return start.format('MMM D, YYYY')
  if (start.isSame(end, 'year') && start.isSame(end, 'month')) {
    return `${start.format('MMM D')} – ${end.format('D, YYYY')}`
  }
  if (start.isSame(end, 'year')) return `${start.format('MMM D')} – ${end.format('MMM D, YYYY')}`
  return `${start.format('MMM D, YYYY')} – ${end.format('MMM D, YYYY')}`
}

function ShareTripButton({ trip }: { trip: Pick<Trip, 'id' | 'name' | 'startDate' | 'endDate'> }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const dateRange = tripDateRange(trip.startDate, trip.endDate)
  const share = {
    origin: window.location.origin,
    tripId: trip.id,
    name: trip.name,
    dateRange,
  }
  const showStatus = copied || copyError

  useEffect(() => {
    if (!showStatus) return
    const timer = window.setTimeout(() => {
      setCopied(false)
      setCopyError(false)
    }, 3200)
    return () => window.clearTimeout(timer)
  }, [showStatus])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(tripShareClipboard(share))
      setCopyError(false)
      setCopied(true)
    } catch {
      setCopied(false)
      setCopyError(true)
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label={copied ? 'Invite copied' : 'Share trip'}
        onClick={() => void copyLink()}
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
        {showStatus ? (
          <motion.p
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{ originX: 1, originY: 0 }}
            className="absolute right-0 top-full z-30 mt-1 w-max max-w-[16rem] rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm text-forest shadow-sm"
          >
            {copyError ? "Couldn't copy. Try again." : 'Copied — ready to paste.'}
          </motion.p>
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

function FindTally({
  players,
  finds,
  unit,
}: {
  players: { uid: string; displayName: string }[]
  finds: Map<string, { playerId: string; playerName: string }>
  unit: 'plate' | 'sighting'
}) {
  const [open, setOpen] = useState(false)
  const reduceMotion = useReducedMotion()
  const rows = useMemo(() => tallyFindsByPlayer(finds.values(), players), [finds, players])
  if (players.length < 2) return null
  const lead = leadingFindCount(rows)
  const leaderNames = rows.filter((row) => lead > 0 && row.count === lead).map((row) => row.playerName)
  const summary =
    leaderNames.length === 0
      ? 'No finds yet'
      : leaderNames.length === 1
        ? `${leaderNames[0]} leading`
        : `${leaderNames.join(' & ')} tied`

  return (
    <div className="mt-3 rounded-xl border border-sand-200 bg-white shadow-sm">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left"
      >
        <span className="text-xs font-medium uppercase tracking-wide text-sand-400">Who's ahead</span>
        <span className="flex min-w-0 items-center gap-2">
          {!open ? <span className="truncate text-sm text-sand-500">{summary}</span> : null}
          <ChevronDown
            className={cn('size-4 shrink-0 text-sand-400 transition-transform', open ? 'rotate-180' : null)}
          />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <ol className="flex flex-col gap-1.5 border-t border-sand-100 px-3 pb-3 pt-2">
              {rows.map((row, index) => {
                const leading = lead > 0 && row.count === lead
                const label = row.count === 1 ? unit : `${unit}s`
                return (
                  <li key={row.playerId} className="flex items-center justify-between gap-3 text-sm">
                    <span
                      className={cn(
                        'flex min-w-0 items-center gap-1.5 truncate',
                        leading ? 'font-semibold text-forest' : 'text-forest',
                      )}
                    >
                      <span className="w-4 shrink-0 text-xs tabular-nums text-sand-400">{index + 1}</span>
                      {leading ? <Star className="size-3.5 shrink-0 fill-gold text-gold" /> : null}
                      <span className="truncate">{row.playerName}</span>
                    </span>
                    <span
                      className={cn(
                        'shrink-0 tabular-nums',
                        leading ? 'font-semibold text-gold' : 'text-sand-500',
                      )}
                    >
                      {row.count} {label}
                    </span>
                  </li>
                )
              })}
            </ol>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

const easeOut = [0.22, 1, 0.36, 1] as const

const chipReveal = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: easeOut },
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
  const cardRef = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  const pct = usaTotal === 0 ? 0 : Math.min(100, (usaFound / usaTotal) * 100)
  const complete = usaFound >= usaTotal && usaTotal > 0

  useEffect(() => {
    let frame = 0
    function update() {
      frame = 0
      const card = cardRef.current
      if (!card) return
      const bottom = card.getBoundingClientRect().bottom
      setStuck((prev) => (prev ? bottom < 24 : bottom <= 0))
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

  return (
    <>
      <motion.div
        ref={cardRef}
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-3 rounded-xl border border-sand-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-brand text-3xl tracking-wide text-forest">
                <AnimatedCount value={usaFound} />
                <span className="ml-1 text-lg font-normal text-sand-400">of {usaTotal}</span>
              </p>
              <p className="text-sm text-sand-500">{complete ? 'Every US plate spotted' : 'US plates spotted'}</p>
            </div>
            <p className="text-right text-xs text-sand-400">
              {complete ? 'Set complete' : `${usaTotal - usaFound} to go`}
            </p>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-sand-100"
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
        </div>
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

      <AnimatePresence>
        {stuck ? (
          <motion.div
            key="score-compact"
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 top-0 z-30 border-b border-sand-200 bg-paper/95 pt-[env(safe-area-inset-top)] shadow-[0_8px_16px_-12px_rgba(28,25,23,0.35)] backdrop-blur"
          >
            <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
              <p className="shrink-0 font-brand text-xl tracking-wide text-forest">
                {usaFound}
                <span className="ml-1 text-sm font-normal text-sand-400">of {usaTotal}</span>
              </p>
              <div
                className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-sand-100"
                role="progressbar"
                aria-hidden
              >
                <div className="h-full rounded-full bg-forest" style={{ width: `${pct}%` }} />
              </div>
              {extra.points > 0 ? <span className="text-xs font-semibold text-gold">+{extra.points}</span> : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
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
  found,
  typicalPercent,
  extraCredit,
  needsLiveStats,
  onOpenChange,
}: {
  rarity: ExtraRarity
  points: number
  found: FoundStat | null
  typicalPercent?: number | null
  extraCredit?: boolean
  needsLiveStats?: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const label = rarityLabel[rarity]
  const colored = !needsLiveStats || found != null
  const percent = found?.percent ?? typicalPercent ?? null

  function show(next: boolean) {
    setOpen(next)
    onOpenChange(next)
  }

  return (
    <span
      className={cn(
        'absolute right-0 top-0 z-10 size-[18px] rounded-bl-md rounded-tr-lg',
        colored ? rarityMark[rarity] : 'bg-sand-300',
      )}
      aria-label={
        percent != null
          ? `${label} find, found ${percent} percent of the time`
          : colored
            ? `${label} find`
            : 'No stats yet'
      }
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
          {colored ? (
            <>
              <span className={cn('font-semibold', rarityText[rarity])}>{label}</span> find
              {percent != null ? (
                <span className="mt-0.5 block text-[11px] text-white/80">Found: {percent}%</span>
              ) : null}
              {found ? (
                <span className="mt-0.5 block text-[11px] text-white/80">
                  {found.foundTrips} of {found.tripCount} {found.tripCount === 1 ? 'trip' : 'trips'}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-[11px] text-white/80">No stats yet</span>
          )}
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
  found,
  typicalPercent,
  needsLiveStats,
  onToggle,
}: {
  name: string
  foundBy?: string
  readOnly: boolean
  extraCredit?: boolean
  rarity?: ExtraRarity | null
  points?: number
  found?: FoundStat | null
  typicalPercent?: number | null
  needsLiveStats?: boolean
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
        'relative flex h-full min-h-14 w-full flex-1 items-center justify-center rounded-lg border px-2 py-3 text-center text-sm font-medium transition-colors',
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
          found={found ?? null}
          typicalPercent={typicalPercent}
          extraCredit={extraCredit}
          needsLiveStats={needsLiveStats}
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
  stats,
  live,
  extraCredit,
  onToggle,
}: {
  country: Country
  found: Map<string, FoundPlate>
  stats: GameStats | null
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
            className="flex"
            variants={
              reduceMotion
                ? undefined
                : {
                    hidden: { opacity: 0, y: 12 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.32, ease: easeOut },
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
              found={itemFoundStat(stats, plateKey(country, plate.name))}
              typicalPercent={plateFoundPercent(country, plate.name)}
              onToggle={() => onToggle(country, plate.name)}
            />
          </motion.div>
        )
      })}
    </motion.div>
  )
}

function WildlifeGrid({
  items,
  found,
  stats,
  live,
  extraCredit,
  onToggle,
}: {
  items: typeof wildlifeAnimals
  found: Map<string, { playerName: string }>
  stats: GameStats | null
  live: boolean
  extraCredit?: boolean
  onToggle: (speciesId: string) => void
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
      {items.map((item) => {
        const hit = found.get(item.id)
        return (
          <motion.div
            key={item.id}
            className="flex"
            variants={
              reduceMotion
                ? undefined
                : {
                    hidden: { opacity: 0, y: 12 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.32, ease: easeOut },
                    },
                  }
            }
          >
            <PlateTile
              name={item.name}
              foundBy={hit?.playerName}
              readOnly={!live}
              extraCredit={extraCredit}
              rarity={item.rarity}
              points={extraCredit ? pointsForRarity(item.rarity) : 0}
              found={itemFoundStat(stats, item.id)}
              needsLiveStats
              onToggle={() => onToggle(item.id)}
            />
          </motion.div>
        )
      })}
    </motion.div>
  )
}

function TripGameNav({ tripId, game }: { tripId: string; game: TripGame }) {
  return (
    <nav
      aria-label="Games"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-sand-200 bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-2">
        <GameTab
          to={tripGameHref(tripId, 'plates')}
          active={game === 'plates'}
          icon={Car}
          label="Plates"
        />
        <GameTab
          to={tripGameHref(tripId, 'wildlife')}
          active={game === 'wildlife'}
          icon={Binoculars}
          label="Wildlife"
        />
      </div>
    </nav>
  )
}

function GameTab({
  to,
  active,
  icon: Icon,
  label,
}: {
  to: string
  active: boolean
  icon: typeof Car
  label: string
}) {
  return (
    <Link
      to={to}
      replace
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-14 flex-col items-center justify-center gap-0.5 border-t-2 text-[11px] font-medium',
        active ? 'border-forest text-forest' : 'border-transparent text-sand-400',
      )}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  )
}

function TimelineEvent({ event }: { event: TripEvent }) {
  if (isWildlifeEvent(event)) {
    const item = wildlifeById[event.speciesId]
    const name = item?.name ?? event.speciesId
    return (
      <>
        {event.playerName} {event.type === 'wildlife_found' ? 'spotted' : 'removed'} {name}
        {item?.kind === 'sign' ? (
          <span className="text-gold">
            {' '}
            · extra credit
            {item.rarity === 'rare' ? ' · rare' : ''}
          </span>
        ) : null}
      </>
    )
  }

  return (
    <>
      {event.playerName} {event.type === 'plate_found' ? 'found' : 'removed'} {event.state}
      {event.country !== 'usa' ? (
        <span className="text-gold">
          {' '}
          · extra credit
          {extraCreditRarity(event.country, event.state) === 'rare' ? ' · rare' : ''}
        </span>
      ) : null}
    </>
  )
}

export function TripPage() {
  const { tripId } = useParams()
  const [params] = useSearchParams()
  const game = parseTripGame(params.get('game'))
  const { profile } = useAuth()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [tripReady, setTripReady] = useState(false)
  const [eventsReady, setEventsReady] = useState(false)
  const [members, setMembers] = useState<TripMember[]>([])
  const [events, setEvents] = useState<TripEvent[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [plateStats, setPlateStats] = useState<GameStats | null>(null)
  const [wildlifeStats, setWildlifeStats] = useState<GameStats | null>(null)
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

  useEffect(() => {
    const stopPlates = listenGameStats('plates', setPlateStats)
    const stopWildlife = listenGameStats('wildlife', setWildlifeStats)
    return () => {
      stopPlates()
      stopWildlife()
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [game])

  useEffect(() => {
    if (!trip) return
    const previous = document.title
    document.title = tripShareTitle(trip.name)
    return () => {
      document.title = previous
    }
  }, [trip])

  const found = useMemo(() => projectFoundPlates(events.filter(isPlateEvent)), [events])
  const wildlifeFound = useMemo(
    () => projectWildlifeSightings(events.filter(isWildlifeEvent)),
    [events],
  )
  const animalsSpotted = useMemo(
    () => wildlifeAnimals.filter((item) => wildlifeFound.has(item.id)).length,
    [wildlifeFound],
  )
  const signsSpotted = useMemo(
    () => wildlifeSigns.filter((item) => wildlifeFound.has(item.id)).length,
    [wildlifeFound],
  )
  const wildlifeSignPoints = useMemo(
    () =>
      wildlifeSigns.reduce(
        (sum, item) => (wildlifeFound.has(item.id) ? sum + pointsForRarity(item.rarity) : sum),
        0,
      ),
    [wildlifeFound],
  )
  const timeline = useMemo(() => {
    const relevant = events.filter((event) =>
      game === 'wildlife' ? isWildlifeEvent(event) : isPlateEvent(event),
    )
    return [...relevant].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 40)
  }, [events, game])
  const live = trip ? isTripLive(trip) : false
  const active = trip ? isTripActive(trip) : false
  const playState = trip ? tripPlayState(trip) : 'ended'
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
    if (!tripId || !profile || !active || !isMember) return
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

  async function onToggleWildlife(speciesId: string) {
    if (!tripId || !profile || !active || !isMember) return
    const key = `wildlife:${speciesId}`
    if (pendingToggles.current.has(key)) return
    pendingToggles.current.add(key)
    const currentlyFound = wildlifeFound.has(speciesId)
    try {
      await toggleWildlife({ tripId, currentlyFound, speciesId, player: profile })
      setToggleError(null)
    } catch (err) {
      if (isPermissionDenied(err)) {
        try {
          await joinTrip(tripId, profile)
          await toggleWildlife({ tripId, currentlyFound, speciesId, player: profile })
          setToggleError(null)
          return
        } catch (retryErr) {
          setToggleError(retryErr instanceof Error ? retryErr.message : 'Could not update that sighting.')
          return
        }
      }
      setToggleError(err instanceof Error ? err.message : 'Could not update that sighting.')
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
            <p className="text-sand-600">Join this trip to play.</p>
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
    <div className="pb-[calc(4.75rem+env(safe-area-inset-bottom))]">
      <div>
        <BackToTrips />
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-brand text-2xl tracking-wide text-forest">{trip.name}</h1>
          {live ? <ShareTripButton trip={trip} /> : null}
        </div>
        <PlayingPlayers players={players} />
        <FindTally
          players={players}
          finds={game === 'wildlife' ? wildlifeFound : found}
          unit={game === 'wildlife' ? 'sighting' : 'plate'}
        />
      </div>

      {game === 'plates' ? (
        <PlateScore
          usaFound={usaFound}
          usaTotal={plates.usa.length}
          extra={extra}
          canadaTotal={plates.canada.length}
          mexicoTotal={plates.mexico.length}
        />
      ) : null}

      {!live ? (
        <p className="mt-3 rounded-lg border border-sand-200 bg-sand-50 px-3 py-2 text-sm text-sand-600">
          This trip has ended. You can look back, but finds can no longer be changed.
        </p>
      ) : playState === 'upcoming' ? (
        <p className="mt-3 rounded-lg border border-sand-200 bg-sand-50 px-3 py-2 text-sm text-sand-600">
          This trip starts {dayjs(trip.startDate).format('MMM D, YYYY')}. You can look around, but
          plates and wildlife stay locked until then.
        </p>
      ) : null}
      {toggleError ? <p className="mt-2 text-sm text-red-700">{toggleError}</p> : null}

      {game === 'plates' ? (
        <>
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">{countryLabels.usa}</h2>
        <UsaPlateMap found={found} />
        <div className="mt-3">
          <RarityLegend />
        </div>
        <div className="mt-4">
          <PlateGrid
            country="usa"
            found={found}
            stats={plateStats}
            live={active}
            onToggle={(country, state) => void onToggle(country, state)}
          />
        </div>
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
                stats={plateStats}
                live={active}
                extraCredit
                onToggle={(nextCountry, state) => void onToggle(nextCountry, state)}
              />
            </div>
          )
        })}
      </section>
        </>
      ) : (
      <section className="mt-3 flex flex-col gap-6 rounded-xl border border-sand-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="font-brand flex items-center gap-2 text-xl tracking-wide text-forest">
            <Binoculars className="size-5 text-gold" />
            Wildlife hunt
          </h2>
          <p className="mt-1 text-sm text-sand-600">
            Spot them from the car as you drive around the park. Stay in the vehicle and never
            approach. If traffic is stopped, wait until you can look safely.
          </p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="text-sm text-sand-500">
              {animalsSpotted} of {wildlifeAnimals.length} animals
              {signsSpotted > 0 ? ` · ${signsSpotted} signs` : ''}
            </p>
            {wildlifeSignPoints > 0 ? (
              <p className="font-brand text-2xl tracking-wide text-gold">+{wildlifeSignPoints} bonus</p>
            ) : null}
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand-100"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={wildlifeAnimals.length}
            aria-valuenow={animalsSpotted}
            aria-label="Wildlife animals spotted"
          >
            <div
              className="h-full rounded-full bg-forest transition-[width] duration-300"
              style={{ width: `${(animalsSpotted / wildlifeAnimals.length) * 100}%` }}
            />
          </div>
          <div className="mt-3">
            {wildlifeStats && wildlifeStats.tripCount > 0 ? <RarityLegend /> : null}
          </div>
        </div>

        <WildlifeGrid
          items={wildlifeAnimals}
          found={wildlifeFound}
          stats={wildlifeStats}
          live={active}
          onToggle={(speciesId) => void onToggleWildlife(speciesId)}
        />

        <div>
          <h3 className="mb-1 text-lg font-semibold text-forest">
            <span aria-hidden>🪧 </span>
            Signs
          </h3>
          <p className="mb-3 text-sm text-sand-600">
            Extra credit for the days you hear an elk, wait in a jam, or find tracks instead of the
            animal itself.
          </p>
          <WildlifeGrid
            items={wildlifeSigns}
            found={wildlifeFound}
            stats={wildlifeStats}
            live={active}
            extraCredit
            onToggle={(speciesId) => void onToggleWildlife(speciesId)}
          />
        </div>
      </section>
      )}

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
                  <TimelineEvent event={event} />
                </li>
              ))}
            </ol>
          )}
        </div>
      </details>
      <TripGameNav tripId={trip.id} game={game} />
    </div>
  )
}
