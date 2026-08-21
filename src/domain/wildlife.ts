export type WildlifeEventType = 'wildlife_found' | 'wildlife_unfound'

export type WildlifeEvent = {
  id: string
  type: WildlifeEventType
  playerId: string
  playerName: string
  speciesId: string
  at: string
}

export type WildlifeSighting = {
  speciesId: string
  playerId: string
  playerName: string
  at: string
}

export function isWildlifeEventType(type: string): type is WildlifeEventType {
  return type === 'wildlife_found' || type === 'wildlife_unfound'
}

export function projectWildlifeSightings(events: readonly WildlifeEvent[]): Map<string, WildlifeSighting> {
  const found = new Map<string, WildlifeSighting>()
  const sorted = [...events].sort((a, b) => {
    if (a.at === b.at) return a.id.localeCompare(b.id)
    return a.at < b.at ? -1 : 1
  })

  for (const event of sorted) {
    if (event.type === 'wildlife_found') {
      found.set(event.speciesId, {
        speciesId: event.speciesId,
        playerId: event.playerId,
        playerName: event.playerName,
        at: event.at,
      })
    } else {
      found.delete(event.speciesId)
    }
  }

  return found
}
