import { describe, expect, it } from 'vitest'
import { isPlateEvent, isWildlifeEvent, parseTripEvent } from './trip-event'

describe('parseTripEvent', () => {
  it('parses a plate find', () => {
    const event = parseTripEvent('1', {
      type: 'plate_found',
      playerId: 'ben',
      playerName: 'Ben',
      country: 'usa',
      state: 'Wyoming',
      at: '2026-08-20T12:00:00.000Z',
    })
    expect(event && isPlateEvent(event) && event.state).toBe('Wyoming')
  })

  it('parses a wildlife sighting and ignores unknown types', () => {
    const event = parseTripEvent('2', {
      type: 'wildlife_found',
      playerId: 'logan',
      playerName: 'Logan',
      speciesId: 'moose',
      at: '2026-08-20T12:00:00.000Z',
    })
    expect(event && isWildlifeEvent(event) && event.speciesId).toBe('moose')
    expect(parseTripEvent('3', { type: 'note', playerId: 'x', at: '2026-08-20T12:00:00.000Z' })).toBeNull()
  })
})
