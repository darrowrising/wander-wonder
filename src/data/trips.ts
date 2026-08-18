import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { createJoinCode } from '@/domain/join-code'
import type { Country, PlateEvent } from '@/domain/plates'
import type { Trip, TripMember, UserProfile } from '@/domain/trip'
import { db } from '@/lib/firebase'

function tripRef(tripId: string) {
  return doc(db, 'trips', tripId)
}

export async function ensureUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(
    doc(db, 'users', profile.uid),
    {
      displayName: profile.displayName,
      email: profile.email,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  )
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
    const tripDoc = await addDoc(collection(db, 'trips'), {
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      joinCode,
      hostUid: input.host.uid,
      memberUids: [input.host.uid],
      createdAt,
    })

    await setDoc(codeRef, { tripId: tripDoc.id })
    await setDoc(doc(db, 'trips', tripDoc.id, 'members', input.host.uid), {
      displayName: input.host.displayName,
      joinedAt: createdAt,
      role: 'host',
    })

    return {
      id: tripDoc.id,
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      joinCode,
      hostUid: input.host.uid,
      memberUids: [input.host.uid],
      createdAt,
    }
  }

  throw new Error('Could not allocate a join code. Try again.')
}

export async function joinTripByCode(code: string, profile: UserProfile): Promise<string> {
  const snap = await getDoc(doc(db, 'joinCodes', code))
  if (!snap.exists()) {
    throw new Error('No trip found for that code.')
  }

  const tripId = snap.data().tripId as string
  const tripSnap = await getDoc(tripRef(tripId))
  if (!tripSnap.exists()) {
    throw new Error('That trip no longer exists.')
  }

  const memberUids = (tripSnap.data().memberUids as string[] | undefined) ?? []
  if (memberUids.includes(profile.uid)) {
    return tripId
  }

  await updateDoc(tripRef(tripId), {
    memberUids: arrayUnion(profile.uid),
  })
  await setDoc(doc(db, 'trips', tripId, 'members', profile.uid), {
    displayName: profile.displayName,
    joinedAt: new Date().toISOString(),
    role: 'member',
  })

  return tripId
}

export function listenMyTrips(uid: string, onChange: (trips: Trip[]) => void): Unsubscribe {
  const q = query(collection(db, 'trips'), where('memberUids', 'array-contains', uid))
  return onSnapshot(q, (snap) => {
    const trips = snap.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<Trip, 'id'>) }))
    trips.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    onChange(trips)
  })
}

export function listenTrip(tripId: string, onChange: (trip: Trip | null) => void): Unsubscribe {
  return onSnapshot(tripRef(tripId), (snap) => {
    if (!snap.exists()) {
      onChange(null)
      return
    }
    onChange({ id: snap.id, ...(snap.data() as Omit<Trip, 'id'>) })
  })
}

export function listenMembers(tripId: string, onChange: (members: TripMember[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'trips', tripId, 'members'), (snap) => {
    onChange(
      snap.docs.map((item) => ({
        uid: item.id,
        ...(item.data() as Omit<TripMember, 'uid'>),
      })),
    )
  })
}

export function listenEvents(tripId: string, onChange: (events: PlateEvent[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'trips', tripId, 'events'), (snap) => {
    onChange(
      snap.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<PlateEvent, 'id'>),
      })),
    )
  })
}

export async function writePlateEvent(
  tripId: string,
  event: Omit<PlateEvent, 'id'>,
): Promise<void> {
  await addDoc(collection(db, 'trips', tripId, 'events'), event)
}

export async function togglePlate(input: {
  tripId: string
  currentlyFound: boolean
  country: Country
  state: string
  player: UserProfile
}): Promise<void> {
  await writePlateEvent(input.tripId, {
    type: input.currentlyFound ? 'plate_unfound' : 'plate_found',
    playerId: input.player.uid,
    playerName: input.player.displayName,
    country: input.country,
    state: input.state,
    at: new Date().toISOString(),
  })
}

type LegacyGame = {
  uid?: string
  name?: string
  startDate?: string
  endDate?: string
  plates?: Array<{ country?: string; state?: string; dateFound?: string }>
}

export async function importLegacyGames(profile: UserProfile): Promise<number> {
  const imported = await getDocs(collection(db, 'users', profile.uid, 'legacyImports'))
  const already = new Set(imported.docs.map((item) => item.id))
  const games = await getDocs(collection(db, 'games'))
  let count = 0

  for (const gameDoc of games.docs) {
    const game = gameDoc.data() as LegacyGame
    const legacyId = game.uid ?? gameDoc.id
    if (already.has(legacyId)) continue

    const createdAt = new Date().toISOString()
    let joinCode = createJoinCode()
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const codeSnap = await getDoc(doc(db, 'joinCodes', joinCode))
      if (!codeSnap.exists()) break
      joinCode = createJoinCode()
    }

    const tripDoc = await addDoc(collection(db, 'trips'), {
      name: game.name ?? 'Imported trip',
      startDate: game.startDate ?? '',
      endDate: game.endDate ?? '',
      joinCode,
      hostUid: profile.uid,
      memberUids: [profile.uid],
      legacyGameId: legacyId,
      createdAt,
    })

    await setDoc(doc(db, 'joinCodes', joinCode), { tripId: tripDoc.id })
    await setDoc(doc(db, 'trips', tripDoc.id, 'members', profile.uid), {
      displayName: profile.displayName,
      joinedAt: createdAt,
      role: 'host',
    })

    const plates = game.plates ?? []
    await Promise.all(
      plates.map((plate, index) =>
        addDoc(collection(db, 'trips', tripDoc.id, 'events'), {
          type: 'plate_found',
          playerId: profile.uid,
          playerName: profile.displayName,
          country: plate.country === 'canada' || plate.country === 'mexico' ? plate.country : 'usa',
          state: plate.state ?? 'Unknown',
          at: plate.dateFound ?? createdAt,
          imported: true,
          sort: index,
        }),
      ),
    )

    await setDoc(doc(db, 'users', profile.uid, 'legacyImports', legacyId), {
      tripId: tripDoc.id,
      importedAt: createdAt,
    })
    count += 1
  }

  return count
}
