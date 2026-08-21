export const tripGames = ['plates', 'wildlife'] as const

export type TripGame = (typeof tripGames)[number]

export function parseTripGame(value: string | null | undefined): TripGame {
  return value === 'wildlife' ? 'wildlife' : 'plates'
}

export function tripGameHref(tripId: string, game: TripGame): string {
  return game === 'wildlife' ? `/trips/${tripId}?game=wildlife` : `/trips/${tripId}`
}
