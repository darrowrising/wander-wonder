import { describe, expect, it } from 'vitest'
import { parseTripGame, tripGameHref } from './trip-game'

describe('parseTripGame', () => {
  it('defaults to plates', () => {
    expect(parseTripGame(null)).toBe('plates')
    expect(parseTripGame(undefined)).toBe('plates')
    expect(parseTripGame('plates')).toBe('plates')
    expect(parseTripGame('other')).toBe('plates')
  })

  it('opens wildlife from the query param', () => {
    expect(parseTripGame('wildlife')).toBe('wildlife')
  })
})

describe('tripGameHref', () => {
  it('omits the param for the default plates game', () => {
    expect(tripGameHref('abc', 'plates')).toBe('/trips/abc')
  })

  it('puts wildlife in the query string', () => {
    expect(tripGameHref('abc', 'wildlife')).toBe('/trips/abc?game=wildlife')
  })
})
