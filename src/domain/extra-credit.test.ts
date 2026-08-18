import { describe, expect, it } from 'vitest'
import {
  extraCreditPoints,
  extraCreditRarity,
  plateFoundPercent,
  plateRarity,
  summarizeExtraCredit,
} from './extra-credit'
import type { FoundPlate } from './plates'

function found(partial: Pick<FoundPlate, 'country' | 'state'>): FoundPlate {
  return {
    playerId: 'p',
    playerName: 'Pat',
    at: '2026-08-18T12:00:00.000Z',
    ...partial,
  }
}

describe('extra credit rarity', () => {
  it('does not score US plates as extra credit', () => {
    expect(extraCreditRarity('usa', 'Wyoming')).toBeNull()
    expect(extraCreditPoints('usa', 'Wyoming')).toBe(0)
  })

  it('ranks US plates by how often they show up on the road', () => {
    expect(plateRarity('usa', 'California')).toBe('common')
    expect(plateRarity('usa', 'Oregon')).toBe('uncommon')
    expect(plateRarity('usa', 'Hawaii')).toBe('rare')
    expect(plateRarity('usa', 'Wyoming')).toBe('rare')
  })

  it('gives each plate a stable typical find rate', () => {
    expect(plateFoundPercent('usa', 'California')).toBeGreaterThan(70)
    expect(plateFoundPercent('usa', 'Hawaii')).toBeLessThan(10)
    expect(plateFoundPercent('usa', 'Oregon')).toBe(plateFoundPercent('usa', 'Oregon'))
    expect(plateFoundPercent('usa', 'Oregon')).toBeGreaterThanOrEqual(20)
    expect(plateFoundPercent('usa', 'Oregon')).toBeLessThanOrEqual(40)
  })

  it('treats nearby Canadian plates as common and far-north as rare', () => {
    expect(extraCreditRarity('canada', 'Ontario')).toBe('common')
    expect(extraCreditPoints('canada', 'Ontario')).toBe(1)
    expect(extraCreditRarity('canada', 'Nunavut')).toBe('rare')
    expect(extraCreditPoints('canada', 'Nunavut')).toBe(3)
  })

  it('treats border Mexican plates as common and far-south as rare', () => {
    expect(extraCreditRarity('mexico', 'Sonora')).toBe('common')
    expect(extraCreditRarity('mexico', 'Yucatán')).toBe('rare')
    expect(extraCreditPoints('mexico', 'Yucatán')).toBe(3)
  })
})

describe('summarizeExtraCredit', () => {
  it('tallies bonus points, rare finds, and North America', () => {
    const map = new Map<string, FoundPlate>([
      ['usa:Wyoming', found({ country: 'usa', state: 'Wyoming' })],
      ['canada:Ontario', found({ country: 'canada', state: 'Ontario' })],
      ['canada:Nunavut', found({ country: 'canada', state: 'Nunavut' })],
      ['mexico:Sonora', found({ country: 'mexico', state: 'Sonora' })],
    ])

    expect(summarizeExtraCredit(map)).toEqual({
      points: 5,
      canada: 2,
      mexico: 1,
      rareFinds: 1,
      bothBorders: true,
      northAmerica: true,
    })
  })

  it('starts empty', () => {
    expect(summarizeExtraCredit(new Map())).toEqual({
      points: 0,
      canada: 0,
      mexico: 0,
      rareFinds: 0,
      bothBorders: false,
      northAmerica: false,
    })
  })
})
