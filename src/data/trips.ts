import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocFromCache,
  getDocFromServer,
  onSnapshot,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore'
import { createJoinCode } from '@/domain/join-code'
import type { Country, PlateEvent } from '@/domain/plates'
import { isTripLive, type Trip, type TripMember, type UserProfile } from '@/domain/trip'
import { db } from '@/lib/firebase'

function tripRef(tripId: string) {
  return doc(db, 'trips', tripId)
}

function memberRef(tripId: string, uid: string) {
  return doc(db, 'trips', tripId, 'members', uid)
}

function endsAtFromDate(endDate: string): Timestamp {
  if (!endDate) return Timestamp.fromMillis(0)
  const ms = Date.parse(`${endDate}T23:59:59.999`)
  if (Number.isNaN(ms)) return Timestamp.fromMillis(0)
  return Timestamp.fromMillis(ms)
}

function timestampToMs(value: unknown): number | undefined {
  if (value instanceof Timestamp) return value.toMillis()
  if (value && typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') {
    return (value as Timestamp).toMillis()
  }
  if (typeof value === 'number') return value
  return undefined
}

function tripFromDoc(id: string, data: DocumentData): Trip {
  const endDate = String(data.endDate ?? '')
  return {
    id,
    name: String(data.name ?? ''),
    startDate: String(data.startDate ?? ''),
    endDate,
    endsAt: timestampToMs(data.endsAt),
    joinCode: String(data.joinCode ?? ''),
    hostUid: String(data.hostUid ?? ''),
    memberUids: Array.isArray(data.memberUids)
      ? data.memberUids.filter((uid): uid is string => typeof uid === 'string')
      : [],
    legacyGameId: typeof data.legacyGameId === 'string' ? data.legacyGameId : undefined,
    createdAt: String(data.createdAt ?? ''),
  }
}

export async function ensureUserProfile(profile: UserProfile): Promise<void> {
  try {
    await setDoc(
      doc(db, 'users', profile.uid),
      {
        displayName: profile.displayName,
        email: profile.email,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    )
  } catch {
    // Offline or rules; the session still works from local auth.
  }
}

export async function createTrip(input: {
  name: string
  startDate: string
  endDate: string
  host: UserProfile
}): Promise<Trip> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const joinCode = createJoinCode()
    const codeRef = doc(db, 'joinCodes', joinCode)
    const existing = await getDoc(codeRef)
    if (existing.exists()) continue

    const createdAt = new Date().toISOString()
    const endsAt = endsAtFromDate(input.endDate)
    const tripDoc = await addDoc(collection(db, 'trips'), {
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      endsAt,
      joinCode,
      hostUid: input.host.uid,
      memberUids: [input.host.uid],
      createdAt,
    })

    await setDoc(codeRef, { tripId: tripDoc.id })
    await setDoc(memberRef(tripDoc.id, input.host.uid), {
      displayName: input.host.displayName,
      joinedAt: createdAt,
      role: 'host',
    })

    return {
      id: tripDoc.id,
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      endsAt: endsAt.toMillis(),
      joinCode,
      hostUid: input.host.uid,
      memberUids: [input.host.uid],
      createdAt,
    }
  }

  throw new Error('Could not allocate a join code. Try again.')
}

export async function ensureTripMember(tripId: string, profile: UserProfile): Promise<void> {
  await setDoc(
    memberRef(tripId, profile.uid),
    {
      displayName: profile.displayName,
      joinedAt: new Date().toISOString(),
      role: 'member',
    },
    { merge: true },
  )
}

export async function joinTrip(tripId: string, profile: UserProfile): Promise<void> {
  const tripSnap = await getDocFromServer(tripRef(tripId))
  if (!tripSnap.exists()) {
    throw new Error('That trip no longer exists.')
  }

  const trip = tripFromDoc(tripSnap.id, tripSnap.data())
  if (!isTripLive(trip)) {
    throw new Error('That trip has ended and can no longer be joined.')
  }

  if (!trip.memberUids.includes(profile.uid)) {
    await updateDoc(tripRef(tripId), {
      memberUids: arrayUnion(profile.uid),
    })
  }

  await ensureTripMember(tripId, profile)
}

export async function backfillTripEndsAt(trip: Trip, hostUid: string): Promise<void> {
  if (trip.endsAt != null || trip.hostUid !== hostUid) return
  try {
    await updateDoc(tripRef(trip.id), { endsAt: endsAtFromDate(trip.endDate) })
  } catch {
    // Will retry next time we're online.
  }
}

export function listenMyTrips(
  uid: string,
  onChange: (trips: Trip[]) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const q = query(collection(db, 'trips'), where('memberUids', 'array-contains', uid))
  let delivered = false
  return onSnapshot(
    q,
    (snap) => {
      delivered = true
      const trips = snap.docs.map((item) => tripFromDoc(item.id, item.data()))
      trips.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      onChange(trips)
    },
    (err) => {
      if (!delivered) onError?.(err.message)
    },
  )
}

export function listenTrip(
  tripId: string,
  onChange: (trip: Trip | null) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  let delivered = false
  return onSnapshot(
    tripRef(tripId),
    (snap) => {
      delivered = true
      if (!snap.exists()) {
        onChange(null)
        return
      }
      onChange(tripFromDoc(snap.id, snap.data()))
    },
    (err) => {
      if (!delivered) onError?.(err.message)
    },
  )
}

export function listenMembers(
  tripId: string,
  onChange: (members: TripMember[]) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  let delivered = false
  return onSnapshot(
    collection(db, 'trips', tripId, 'members'),
    (snap) => {
      delivered = true
      onChange(
        snap.docs.map((item) => ({
          uid: item.id,
          ...(item.data() as Omit<TripMember, 'uid'>),
        })),
      )
    },
    (err) => {
      if (!delivered) onError?.(err.message)
    },
  )
}

export function listenEvents(
  tripId: string,
  onChange: (events: PlateEvent[]) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  let delivered = false
  return onSnapshot(
    collection(db, 'trips', tripId, 'events'),
    (snap) => {
      delivered = true
      onChange(
        snap.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<PlateEvent, 'id'>),
        })),
      )
    },
    (err) => {
      if (!delivered) onError?.(err.message)
    },
  )
}

export function warmTripCache(tripId: string): Unsubscribe {
  const stops = [listenTrip(tripId, () => {}), listenMembers(tripId, () => {}), listenEvents(tripId, () => {})]
  return () => {
    for (const stop of stops) stop()
  }
}

export async function writePlateEvent(
  tripId: string,
  event: Omit<PlateEvent, 'id'>,
): Promise<void> {
  await addDoc(collection(db, 'trips', tripId, 'events'), event)
}

async function readTripForWrite(tripId: string): Promise<Trip> {
  try {
    const cached = await getDocFromCache(tripRef(tripId))
    if (cached.exists()) return tripFromDoc(cached.id, cached.data())
  } catch {
    // Not in the local cache yet.
  }
  const snap = await getDoc(tripRef(tripId))
  if (!snap.exists()) {
    throw new Error('That trip no longer exists.')
  }
  return tripFromDoc(snap.id, snap.data())
}

export async function togglePlate(input: {
  tripId: string
  currentlyFound: boolean
  country: Country
  state: string
  player: UserProfile
}): Promise<void> {
  const trip = await readTripForWrite(input.tripId)
  if (!isTripLive(trip)) {
    throw new Error('This trip has ended. Plates can no longer be changed.')
  }

  await writePlateEvent(input.tripId, {
    type: input.currentlyFound ? 'plate_unfound' : 'plate_found',
    playerId: input.player.uid,
    playerName: input.player.displayName,
    country: input.country,
    state: input.state,
    at: new Date().toISOString(),
  })
}
