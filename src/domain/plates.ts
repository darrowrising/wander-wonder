export type Country = 'usa' | 'canada' | 'mexico'

export type PlateEventType = 'plate_found' | 'plate_unfound'

export type PlateEvent = {
  id: string
  type: PlateEventType
  playerId: string
  playerName: string
  country: Country
  state: string
  at: string
}

export type FoundPlate = {
  country: Country
  state: string
  playerId: string
  playerName: string
  at: string
}

export function plateKey(country: Country, state: string): string {
  return `${country}:${state}`
}

export function projectFoundPlates(events: readonly PlateEvent[]): Map<string, FoundPlate> {
  const found = new Map<string, FoundPlate>()
  const sorted = [...events].sort((a, b) => {
    if (a.at === b.at) return a.id.localeCompare(b.id)
    return a.at < b.at ? -1 : 1
  })

  for (const event of sorted) {
    const key = plateKey(event.country, event.state)
    if (event.type === 'plate_found') {
      found.set(key, {
        country: event.country,
        state: event.state,
        playerId: event.playerId,
        playerName: event.playerName,
        at: event.at,
      })
    } else if (event.type === 'plate_unfound') {
      found.delete(key)
    }
  }

  return found
}

export function countFoundByCountry(
  found: Map<string, FoundPlate>,
  country: Country,
): number {
  let count = 0
  for (const plate of found.values()) {
    if (plate.country === country) count += 1
  }
  return count
}
