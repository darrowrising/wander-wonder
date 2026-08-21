import { collection, doc, getDocs, onSnapshot, runTransaction, setDoc, type Unsubscribe } from 'firebase/firestore'
import { parseTripEvent, isPlateEvent, isWildlifeEvent, type TripEvent } from '@/domain/trip-event'
import { plateKey, projectFoundPlates } from '@/domain/plates'
import { projectWildlifeSightings } from '@/domain/wildlife'
import {
  applyTripFoundDelta,
  buildPlateStats,
  buildWildlifeStats,
  emptyGameStats,
  parseGameStats,
  plateCatalogKeys,
  wildlifeCatalogKeys,
  type GameStats,
  type GameStatsId,
} from '@/domain/game-stats'
import { db } from '@/lib/firebase'

function eventsFromDocs(
  docs: { id: string; data: () => Record<string, unknown> }[],
): TripEvent[] {
  return docs
    .map((item) => parseTripEvent(item.id, item.data()))
    .filter((event): event is TripEvent => event != null)
}

async function loadAllTripEvents(): Promise<{ tripId: string; events: TripEvent[] }[]> {
  const trips = await getDocs(collection(db, 'trips'))
  return Promise.all(
    trips.docs.map(async (trip) => {
      const events = await getDocs(collection(db, 'trips', trip.id, 'events'))
      return {
        tripId: trip.id,
        events: eventsFromDocs(
          events.docs.map((item) => ({ id: item.id, data: () => item.data() as Record<string, unknown> })),
        ),
      }
    }),
  )
}

async function loadTripEvents(tripId: string): Promise<TripEvent[]> {
  const events = await getDocs(collection(db, 'trips', tripId, 'events'))
  return eventsFromDocs(
    events.docs.map((item) => ({ id: item.id, data: () => item.data() as Record<string, unknown> })),
  )
}

export async function rebuildPlateStats(): Promise<GameStats> {
  const stats = buildPlateStats(await loadAllTripEvents())
  await setDoc(doc(db, 'stats', 'plates'), stats)
  return stats
}

export async function rebuildWildlifeStats(): Promise<GameStats> {
  const stats = buildWildlifeStats(await loadAllTripEvents())
  await setDoc(doc(db, 'stats', 'wildlife'), stats)
  return stats
}

async function syncGameStats(input: {
  id: GameStatsId
  tripId: string
  previousKeys: Iterable<string>
  nextKeys: Iterable<string>
  catalogKeys: readonly string[]
}): Promise<void> {
  const ref = doc(db, 'stats', input.id)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const current = snap.exists()
      ? parseGameStats(snap.data() as Record<string, unknown>)
      : emptyGameStats(input.catalogKeys)
    tx.set(
      ref,
      applyTripFoundDelta({
        stats: current,
        tripId: input.tripId,
        previousKeys: input.previousKeys,
        nextKeys: input.nextKeys,
        catalogKeys: input.catalogKeys,
      }),
    )
  })
}

export async function syncPlateStatsFromTrip(tripId: string, event: TripEvent): Promise<void> {
  if (!isPlateEvent(event)) return
  const events = [...(await loadTripEvents(tripId)), event]
  const after = projectFoundPlates(events.filter(isPlateEvent))
  const before = new Map(after)
  const key = plateKey(event.country, event.state)
  if (event.type === 'plate_found') before.delete(key)
  else before.set(key, after.get(key) ?? { country: event.country, state: event.state, playerId: event.playerId, playerName: event.playerName, at: event.at })
  await syncGameStats({
    id: 'plates',
    tripId,
    previousKeys: before.keys(),
    nextKeys: after.keys(),
    catalogKeys: plateCatalogKeys(),
  })
}

export async function syncWildlifeStatsFromTrip(tripId: string, event: TripEvent): Promise<void> {
  if (!isWildlifeEvent(event)) return
  const events = [...(await loadTripEvents(tripId)), event]
  const after = projectWildlifeSightings(events.filter(isWildlifeEvent))
  const before = new Map(after)
  if (event.type === 'wildlife_found') before.delete(event.speciesId)
  else {
    before.set(event.speciesId, after.get(event.speciesId) ?? {
      speciesId: event.speciesId,
      playerId: event.playerId,
      playerName: event.playerName,
      at: event.at,
    })
  }
  await syncGameStats({
    id: 'wildlife',
    tripId,
    previousKeys: before.keys(),
    nextKeys: after.keys(),
    catalogKeys: wildlifeCatalogKeys(),
  })
}

export function listenGameStats(
  id: GameStatsId,
  onChange: (stats: GameStats | null) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'stats', id),
    (snap) => {
      if (!snap.exists()) {
        onChange(null)
        return
      }
      onChange(parseGameStats(snap.data() as Record<string, unknown>))
    },
    (err) => {
      onChange(null)
      onError?.(err.message)
    },
  )
}
