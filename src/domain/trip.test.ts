import { describe, expect, it } from 'vitest'
import { isTripActive, isTripLive, isTripStarted, tripPlayState } from './trip'

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

describe('isTripStarted', () => {
  const now = Date.parse('2026-08-17T18:00:00.000Z')

  it('treats a missing start date as already started', () => {
    expect(isTripStarted({ startDate: '' }, now)).toBe(true)
  })

  it('starts at the beginning of the start date', () => {
    expect(isTripStarted({ startDate: '2026-08-17' }, now)).toBe(true)
  })

  it('stays locked before the start date', () => {
    expect(isTripStarted({ startDate: '2026-09-01' }, now)).toBe(false)
  })
})

describe('isTripActive', () => {
  const now = Date.parse('2026-08-17T18:00:00.000Z')
  const endsAt = Date.parse('2026-08-22T23:59:59.999Z')

  it('is not active before the start date', () => {
    expect(isTripActive({ startDate: '2026-09-01', endDate: '2026-09-10', endsAt: Date.parse('2026-09-10T23:59:59.999Z') }, now)).toBe(
      false,
    )
  })

  it('is active between start and end', () => {
    expect(isTripActive({ startDate: '2026-08-16', endDate: '2026-08-22', endsAt }, now)).toBe(true)
  })

  it('is not active after the trip ends', () => {
    expect(isTripActive({ startDate: '2026-08-01', endDate: '2026-08-10', endsAt: Date.parse('2026-08-10T23:59:59.999Z') }, now)).toBe(
      false,
    )
  })
})

describe('tripPlayState', () => {
  const now = Date.parse('2026-08-17T18:00:00.000Z')

  it('marks a future trip as upcoming even though it has not ended', () => {
    expect(
      tripPlayState(
        { startDate: '2026-09-01', endDate: '2026-09-10', endsAt: Date.parse('2026-09-10T23:59:59.999Z') },
        now,
      ),
    ).toBe('upcoming')
  })

  it('marks a current trip as active', () => {
    expect(
      tripPlayState({ startDate: '2026-08-16', endDate: '2026-08-22', endsAt: Date.parse('2026-08-22T23:59:59.999Z') }, now),
    ).toBe('active')
  })

  it('marks a finished trip as ended', () => {
    expect(
      tripPlayState({ startDate: '2026-08-01', endDate: '2026-08-10', endsAt: Date.parse('2026-08-10T23:59:59.999Z') }, now),
    ).toBe('ended')
  })
})
