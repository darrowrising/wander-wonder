import type { PlateEvent } from '@/domain/plates'
import { isWildlifeEventType, type WildlifeEvent } from '@/domain/wildlife'

export type TripEvent = PlateEvent | WildlifeEvent

export function isPlateEvent(event: TripEvent): event is PlateEvent {
  return event.type === 'plate_found' || event.type === 'plate_unfound'
}

export function isWildlifeEvent(event: TripEvent): event is WildlifeEvent {
  return isWildlifeEventType(event.type)
}

export function parseTripEvent(id: string, data: Record<string, unknown>): TripEvent | null {
  const type = typeof data.type === 'string' ? data.type : ''
  const playerId = typeof data.playerId === 'string' ? data.playerId : ''
  const playerName = typeof data.playerName === 'string' ? data.playerName : ''
  const at = typeof data.at === 'string' ? data.at : ''
  if (!playerId || !at) return null

  if (type === 'plate_found' || type === 'plate_unfound') {
    const country = data.country
    const state = typeof data.state === 'string' ? data.state : ''
    if (country !== 'usa' && country !== 'canada' && country !== 'mexico') return null
    if (!state) return null
    return { id, type, playerId, playerName, country, state, at }
  }

  if (isWildlifeEventType(type)) {
    const speciesId = typeof data.speciesId === 'string' ? data.speciesId : ''
    if (!speciesId) return null
    return { id, type, playerId, playerName, speciesId, at }
  }

  return null
}
