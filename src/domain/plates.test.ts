import { describe, expect, it } from 'vitest'
import { createJoinCode, normalizeJoinCode } from './join-code'
import { projectFoundPlates, type PlateEvent } from './plates'

describe('join codes', () => {
  it('creates ABC-123 style codes', () => {
    expect(createJoinCode()).toMatch(/^[A-Z]{3}-[0-9]{3}$/)
  })

  it('normalizes typed codes', () => {
    expect(normalizeJoinCode('abc123')).toBe('ABC-123')
    expect(normalizeJoinCode('abc-123')).toBe('ABC-123')
  })
})

describe('plate projection', () => {
  const foundWyoming: PlateEvent = {
    id: '1',
    type: 'plate_found',
    playerId: 'grandma',
    playerName: 'Grandma',
    country: 'usa',
    state: 'Wyoming',
    at: '2026-08-18T15:42:00.000Z',
  }

  it('marks a plate found from the latest found event', () => {
    const found = projectFoundPlates([foundWyoming])
    expect(found.get('usa:Wyoming')?.playerName).toBe('Grandma')
  })

  it('anyone can undo; unfound clears the family board', () => {
    const undone: PlateEvent = {
      ...foundWyoming,
      id: '2',
      type: 'plate_unfound',
      playerId: 'ben',
      playerName: 'Ben',
      at: '2026-08-18T15:43:00.000Z',
    }
    const found = projectFoundPlates([foundWyoming, undone])
    expect(found.has('usa:Wyoming')).toBe(false)
  })

  it('a later find restores the plate', () => {
    const undone: PlateEvent = {
      ...foundWyoming,
      id: '2',
      type: 'plate_unfound',
      playerId: 'ben',
      playerName: 'Ben',
      at: '2026-08-18T15:43:00.000Z',
    }
    const refound: PlateEvent = {
      ...foundWyoming,
      id: '3',
      playerId: 'ben',
      playerName: 'Ben',
      at: '2026-08-18T15:44:00.000Z',
    }
    const found = projectFoundPlates([foundWyoming, undone, refound])
    expect(found.get('usa:Wyoming')?.playerId).toBe('ben')
  })
})
