import { plates } from '@/config/plates'
import { wildlifeItems } from '@/config/wildlife'
import { plateKey, projectFoundPlates } from '@/domain/plates'
import { isPlateEvent, isWildlifeEvent, type TripEvent } from '@/domain/trip-event'
import { projectWildlifeSightings } from '@/domain/wildlife'

export type GameStatsId = 'plates' | 'wildlife'

export type FoundRate = {
  foundTrips: number
  percent: number
}

export type GameStats = {
  updatedAt: string
  tripCount: number
  countedTrips: Record<string, boolean>
  items: Record<string, FoundRate>
}

export type TripEvents = {
  tripId: string
  events: readonly TripEvent[]
}

function rate(foundTrips: number, tripCount: number): FoundRate {
  return {
    foundTrips,
    percent: tripCount === 0 ? 0 : Math.round((foundTrips / tripCount) * 100),
  }
}

export function plateCatalogKeys(): string[] {
  const keys: string[] = []
  for (const country of ['usa', 'canada', 'mexico'] as const) {
    for (const plate of plates[country]) {
      keys.push(plateKey(country, plate.name))
    }
  }
  return keys
}

export function wildlifeCatalogKeys(): string[] {
  return wildlifeItems.map((item) => item.id)
}

function itemsFromCounts(counts: Map<string, number>, catalogKeys: readonly string[], tripCount: number): Record<string, FoundRate> {
  const items: Record<string, FoundRate> = {}
  for (const key of catalogKeys) {
    items[key] = rate(counts.get(key) ?? 0, tripCount)
  }
  return items
}

function recountPercents(items: Record<string, FoundRate>, catalogKeys: readonly string[], tripCount: number): Record<string, FoundRate> {
  const next: Record<string, FoundRate> = {}
  const keys = new Set([...catalogKeys, ...Object.keys(items)])
  for (const key of keys) {
    next[key] = rate(Math.max(0, items[key]?.foundTrips ?? 0), tripCount)
  }
  return next
}

export function itemFoundRate(stats: GameStats | null, key: string): FoundRate | null {
  if (!stats || stats.tripCount <= 0) return null
  return stats.items[key] ?? null
}

export type FoundStat = FoundRate & { tripCount: number }

export function itemFoundStat(stats: GameStats | null, key: string): FoundStat | null {
  const found = itemFoundRate(stats, key)
  if (!found || !stats) return null
  return { ...found, tripCount: stats.tripCount }
}

export function emptyGameStats(catalogKeys: readonly string[], now = new Date()): GameStats {
  return {
    updatedAt: now.toISOString(),
    tripCount: 0,
    countedTrips: {},
    items: itemsFromCounts(new Map(), catalogKeys, 0),
  }
}

export function applyTripFoundDelta(input: {
  stats: GameStats
  tripId: string
  previousKeys: Iterable<string>
  nextKeys: Iterable<string>
  catalogKeys: readonly string[]
  now?: Date
}): GameStats {
  const previous = new Set(input.previousKeys)
  const next = new Set(input.nextKeys)
  const items: Record<string, FoundRate> = {}
  for (const [key, value] of Object.entries(input.stats.items)) {
    items[key] = { ...value }
  }

  const countedTrips = { ...input.stats.countedTrips }
  let tripCount = input.stats.tripCount
  const alreadyCounted = Boolean(countedTrips[input.tripId])

  if (!alreadyCounted) {
    tripCount += 1
    countedTrips[input.tripId] = true
    for (const key of next) {
      items[key] = rate((items[key]?.foundTrips ?? 0) + 1, tripCount)
    }
  } else {
    for (const key of next) {
      if (previous.has(key)) continue
      items[key] = rate((items[key]?.foundTrips ?? 0) + 1, tripCount)
    }
    for (const key of previous) {
      if (next.has(key)) continue
      items[key] = rate(Math.max(0, (items[key]?.foundTrips ?? 0) - 1), tripCount)
    }
  }

  return {
    updatedAt: (input.now ?? new Date()).toISOString(),
    tripCount,
    countedTrips,
    items: recountPercents(items, input.catalogKeys, tripCount),
  }
}

export function buildPlateStats(trips: readonly TripEvents[], now = new Date()): GameStats {
  const played = trips.filter((trip) => trip.events.some(isPlateEvent))
  const countedTrips: Record<string, boolean> = {}
  const counts = new Map<string, number>()

  for (const trip of played) {
    countedTrips[trip.tripId] = true
    const found = projectFoundPlates(trip.events.filter(isPlateEvent))
    for (const key of found.keys()) {
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  const tripCount = played.length
  return {
    updatedAt: now.toISOString(),
    tripCount,
    countedTrips,
    items: itemsFromCounts(counts, plateCatalogKeys(), tripCount),
  }
}

export function buildWildlifeStats(trips: readonly TripEvents[], now = new Date()): GameStats {
  const played = trips.filter((trip) => trip.events.some(isWildlifeEvent))
  const countedTrips: Record<string, boolean> = {}
  const counts = new Map<string, number>()

  for (const trip of played) {
    countedTrips[trip.tripId] = true
    const found = projectWildlifeSightings(trip.events.filter(isWildlifeEvent))
    for (const key of found.keys()) {
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
  }

  const tripCount = played.length
  return {
    updatedAt: now.toISOString(),
    tripCount,
    countedTrips,
    items: itemsFromCounts(counts, wildlifeCatalogKeys(), tripCount),
  }
}

function parsePercent(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 0 && value <= 1) return Math.round(value * 100)
    return Math.round(value)
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsePercent(parsed)
  }
  return 0
}

function parseLegacyPlateStats(data: Record<string, unknown>): GameStats | null {
  if (!Array.isArray(data.stats)) return null

  const items: Record<string, FoundRate> = {}
  let tripCount = 0
  let tripCountFrom = 0

  for (const row of data.stats) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue
    const record = row as Record<string, unknown>
    const state = typeof record.state === 'string' ? record.state : ''
    if (!state) continue
    const country = record.country === 'canada' || record.country === 'mexico' ? record.country : 'usa'
    const foundTrips = typeof record.count === 'number' ? record.count : 0
    const percent = parsePercent(record.percentage)
    if (foundTrips > tripCountFrom && percent > 0) {
      tripCount = Math.round(foundTrips / (percent / 100))
      tripCountFrom = foundTrips
    }
    items[plateKey(country, state)] = { foundTrips, percent }
  }

  if (Object.keys(items).length === 0) return null
  return { updatedAt: '', tripCount, countedTrips: {}, items }
}

export function parseGameStats(data: Record<string, unknown>): GameStats {
  const tripCount = typeof data.tripCount === 'number' ? data.tripCount : 0
  const updatedAt = typeof data.updatedAt === 'string' ? data.updatedAt : ''
  const countedTrips: Record<string, boolean> = {}
  if (data.countedTrips && typeof data.countedTrips === 'object' && !Array.isArray(data.countedTrips)) {
    for (const [tripId, value] of Object.entries(data.countedTrips as Record<string, unknown>)) {
      if (value) countedTrips[tripId] = true
    }
  }

  const items: Record<string, FoundRate> = {}
  const raw = data.items
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue
      const row = value as Record<string, unknown>
      const foundTrips = typeof row.foundTrips === 'number' ? row.foundTrips : 0
      const percent = typeof row.percent === 'number' ? row.percent : 0
      items[key] = { foundTrips, percent }
    }
  }

  if (tripCount > 0 && Object.keys(items).length > 0) {
    return { updatedAt, tripCount, countedTrips, items }
  }

  return parseLegacyPlateStats(data) ?? { updatedAt, tripCount, countedTrips, items }
}
