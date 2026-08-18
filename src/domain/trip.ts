export type Trip = {
  id: string
  name: string
  startDate: string
  endDate: string
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
