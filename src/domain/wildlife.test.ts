import { describe, expect, it } from 'vitest'
import { projectWildlifeSightings, type WildlifeEvent } from './wildlife'

describe('wildlife projection', () => {
  const moose: WildlifeEvent = {
    id: '1',
    type: 'wildlife_found',
    playerId: 'logan',
    playerName: 'Logan',
    speciesId: 'moose',
    at: '2026-08-20T16:10:00.000Z',
  }

  it('marks a sighting from the latest found event', () => {
    const found = projectWildlifeSightings([moose])
    expect(found.get('moose')?.playerName).toBe('Logan')
  })

  it('anyone can undo a sighting', () => {
    const undone: WildlifeEvent = {
      ...moose,
      id: '2',
      type: 'wildlife_unfound',
      playerId: 'ben',
      playerName: 'Ben',
      at: '2026-08-20T16:11:00.000Z',
    }
    expect(projectWildlifeSightings([moose, undone]).has('moose')).toBe(false)
  })
})
