import { describe, expect, it } from 'vitest'
import { leadingFindCount, tallyFindsByPlayer } from './find-tally'

describe('tallyFindsByPlayer', () => {
  const players = [
    { uid: 'ben', displayName: 'Ben' },
    { uid: 'logan', displayName: 'Logan' },
  ]

  it('counts current finds per player and keeps zeros for people still playing', () => {
    const rows = tallyFindsByPlayer(
      [
        { playerId: 'ben', playerName: 'Ben' },
        { playerId: 'ben', playerName: 'Ben' },
        { playerId: 'logan', playerName: 'Logan' },
      ],
      players,
    )
    expect(rows).toEqual([
      { playerId: 'ben', playerName: 'Ben', count: 2 },
      { playerId: 'logan', playerName: 'Logan', count: 1 },
    ])
  })

  it('includes a player with no finds when more than one person is playing', () => {
    const rows = tallyFindsByPlayer([{ playerId: 'ben', playerName: 'Ben' }], [
      ...players,
      { uid: 'pat', displayName: 'Pat' },
    ])
    expect(rows.map((row) => [row.playerName, row.count])).toEqual([
      ['Ben', 1],
      ['Logan', 0],
      ['Pat', 0],
    ])
  })

  it('breaks ties by name and reports the shared lead count', () => {
    const rows = tallyFindsByPlayer(
      [
        { playerId: 'logan', playerName: 'Logan' },
        { playerId: 'ben', playerName: 'Ben' },
      ],
      players,
    )
    expect(rows.map((row) => row.playerName)).toEqual(['Ben', 'Logan'])
    expect(leadingFindCount(rows)).toBe(1)
  })
})
