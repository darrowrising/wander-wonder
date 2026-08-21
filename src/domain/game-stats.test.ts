import { describe, expect, it } from 'vitest'
import {
  applyTripFoundDelta,
  buildPlateStats,
  buildWildlifeStats,
  emptyGameStats,
  itemFoundRate,
  parseGameStats,
  plateCatalogKeys,
} from './game-stats'
import type { PlateEvent } from './plates'
import type { WildlifeEvent } from './wildlife'

function plate(partial: Partial<PlateEvent> & Pick<PlateEvent, 'id' | 'state'>): PlateEvent {
  return {
    type: 'plate_found',
    playerId: 'p',
    playerName: 'Pat',
    country: 'usa',
    at: '2026-08-20T12:00:00.000Z',
    ...partial,
  }
}

function sighting(partial: Partial<WildlifeEvent> & Pick<WildlifeEvent, 'id' | 'speciesId'>): WildlifeEvent {
  return {
    type: 'wildlife_found',
    playerId: 'p',
    playerName: 'Pat',
    at: '2026-08-20T12:00:00.000Z',
    ...partial,
  }
}

describe('buildPlateStats', () => {
  it('counts a plate once per trip after undos', () => {
    const wyoming: PlateEvent = plate({ id: '1', state: 'Wyoming' })
    const undone: PlateEvent = { ...wyoming, id: '2', type: 'plate_unfound' }
    const otherTrip: PlateEvent = plate({ id: '3', state: 'Wyoming' })
    const california: PlateEvent = plate({ id: '4', state: 'California', at: '2026-08-20T12:01:00.000Z' })

    const stats = buildPlateStats(
      [
        { tripId: 'a', events: [wyoming, undone] },
        { tripId: 'b', events: [otherTrip, california] },
      ],
      new Date('2026-08-20T18:00:00.000Z'),
    )

    expect(stats.tripCount).toBe(2)
    expect(stats.countedTrips).toEqual({ a: true, b: true })
    expect(stats.items['usa:Wyoming']).toEqual({ foundTrips: 1, percent: 50 })
    expect(stats.items['usa:California']).toEqual({ foundTrips: 1, percent: 50 })
    expect(stats.items['usa:Hawaii']).toEqual({ foundTrips: 0, percent: 0 })
    expect(stats.updatedAt).toBe('2026-08-20T18:00:00.000Z')
  })

  it('ignores trips that never played plates', () => {
    const stats = buildPlateStats([
      { tripId: 'a', events: [] },
      { tripId: 'b', events: [sighting({ id: '1', speciesId: 'moose' })] },
    ])
    expect(stats.tripCount).toBe(0)
    expect(stats.countedTrips).toEqual({})
    expect(itemFoundRate(stats, 'usa:Wyoming')).toBeNull()
  })
})

describe('buildWildlifeStats', () => {
  it('counts a sighting once per trip', () => {
    const moose = sighting({ id: '1', speciesId: 'moose' })
    const elk = sighting({ id: '2', speciesId: 'elk' })
    const stats = buildWildlifeStats([
      { tripId: 'a', events: [moose, elk] },
      { tripId: 'b', events: [elk] },
    ])

    expect(stats.tripCount).toBe(2)
    expect(stats.items.elk).toEqual({ foundTrips: 2, percent: 100 })
    expect(stats.items.moose).toEqual({ foundTrips: 1, percent: 50 })
    expect(stats.items.grizzly).toEqual({ foundTrips: 0, percent: 0 })
  })
})

describe('applyTripFoundDelta', () => {
  const catalog = plateCatalogKeys()
  const now = new Date('2026-08-20T18:00:00.000Z')

  it('adds a new trip and later finds on that trip without double-counting', () => {
    let stats = emptyGameStats(catalog, now)
    stats = applyTripFoundDelta({
      stats,
      tripId: 't1',
      previousKeys: [],
      nextKeys: ['usa:Wyoming'],
      catalogKeys: catalog,
      now,
    })
    expect(stats.tripCount).toBe(1)
    expect(stats.items['usa:Wyoming']?.foundTrips).toBe(1)

    stats = applyTripFoundDelta({
      stats,
      tripId: 't1',
      previousKeys: ['usa:Wyoming'],
      nextKeys: ['usa:Wyoming', 'usa:California'],
      catalogKeys: catalog,
      now,
    })
    expect(stats.tripCount).toBe(1)
    expect(stats.items['usa:Wyoming']?.foundTrips).toBe(1)
    expect(stats.items['usa:California']?.foundTrips).toBe(1)
  })

  it('undoes a find on a counted trip', () => {
    let stats = applyTripFoundDelta({
      stats: emptyGameStats(catalog, now),
      tripId: 't1',
      previousKeys: [],
      nextKeys: ['usa:Wyoming'],
      catalogKeys: catalog,
      now,
    })
    stats = applyTripFoundDelta({
      stats,
      tripId: 't1',
      previousKeys: ['usa:Wyoming'],
      nextKeys: [],
      catalogKeys: catalog,
      now,
    })
    expect(stats.tripCount).toBe(1)
    expect(stats.items['usa:Wyoming']).toEqual({ foundTrips: 0, percent: 0 })
  })
})

describe('parseGameStats', () => {
  it('reads the legacy stats/plates document from the original game', () => {
    const stats = parseGameStats({
      legend: { min: 4, commonMin: 36, normMin: 68 },
      stats: [
        { state: 'Alabama', country: 'usa', count: 12, percentage: 80, type: 'common' },
        { state: 'Hawaii', country: 'usa', count: 1, percentage: 6, type: 'rare' },
      ],
    })

    expect(stats.tripCount).toBe(15)
    expect(stats.items['usa:Alabama']).toEqual({ foundTrips: 12, percent: 80 })
    expect(stats.items['usa:Hawaii']).toEqual({ foundTrips: 1, percent: 6 })
    expect(itemFoundRate(stats, 'usa:Alabama')?.percent).toBe(80)
  })
})
