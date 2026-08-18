import { describe, expect, it } from 'vitest'
import { isTripLive } from './trip'

describe('isTripLive', () => {
  const now = Date.parse('2026-08-17T18:00:00.000Z')

  it('treats a trip with a future endsAt as live', () => {
    expect(isTripLive({ endDate: '2026-08-22', endsAt: Date.parse('2026-08-22T23:59:59.999Z') }, now)).toBe(
      true,
    )
  })

  it('locks a trip after endsAt', () => {
    expect(isTripLive({ endDate: '2026-08-10', endsAt: Date.parse('2026-08-10T23:59:59.999Z') }, now)).toBe(
      false,
    )
  })

  it('falls back to endDate when endsAt is missing', () => {
    expect(isTripLive({ endDate: '2026-08-10' }, now)).toBe(false)
    expect(isTripLive({ endDate: '2026-08-18' }, now)).toBe(true)
  })

  it('locks imported trips with an empty end date once endsAt is in the past', () => {
    expect(isTripLive({ endDate: '', endsAt: 0 }, now)).toBe(false)
  })
})
