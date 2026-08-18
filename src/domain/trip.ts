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

export function isTripLive(trip: Pick<Trip, 'endDate' | 'endsAt'>, now = Date.now()): boolean {
  if (typeof trip.endsAt === 'number') {
    return trip.endsAt >= now
  }
  if (!trip.endDate) return true
  const end = Date.parse(`${trip.endDate}T23:59:59.999`)
  if (Number.isNaN(end)) return true
  return end >= now
}
