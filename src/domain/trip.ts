export type Trip = {
  id: string
  name: string
  startDate: string
  endDate: string
  endsAt?: number
  joinCode: string
  hostUid: string
  memberUids: string[]
  legacyGameId?: string
  createdAt: string
}

export type TripMember = {
  uid: string
  displayName: string
  joinedAt: string
  role: 'host' | 'member'
}

export type UserProfile = {
  uid: string
  displayName: string
  email: string | null
}

export type TripPlayState = 'upcoming' | 'active' | 'ended'

export function isTripLive(trip: Pick<Trip, 'endDate' | 'endsAt'>, now = Date.now()): boolean {
  if (typeof trip.endsAt === 'number') {
    return trip.endsAt >= now
  }
  if (!trip.endDate) return true
  const end = Date.parse(`${trip.endDate}T23:59:59.999`)
  if (Number.isNaN(end)) return true
  return end >= now
}

export function isTripStarted(trip: Pick<Trip, 'startDate'>, now = Date.now()): boolean {
  if (!trip.startDate) return true
  const start = Date.parse(`${trip.startDate}T00:00:00.000`)
  if (Number.isNaN(start)) return true
  return start <= now
}

export function isTripActive(
  trip: Pick<Trip, 'startDate' | 'endDate' | 'endsAt'>,
  now = Date.now(),
): boolean {
  return isTripStarted(trip, now) && isTripLive(trip, now)
}

export function tripPlayState(
  trip: Pick<Trip, 'startDate' | 'endDate' | 'endsAt'>,
  now = Date.now(),
): TripPlayState {
  if (!isTripLive(trip, now)) return 'ended'
  if (!isTripStarted(trip, now)) return 'upcoming'
  return 'active'
}
