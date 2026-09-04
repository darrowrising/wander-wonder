export type FindCredit = {
  playerId: string
  playerName: string
}

export type PlayerTally = {
  playerId: string
  playerName: string
  count: number
}

export function tallyFindsByPlayer(
  finds: Iterable<FindCredit>,
  players: readonly { uid: string; displayName: string }[] = [],
): PlayerTally[] {
  const counts = new Map<string, { playerName: string; count: number }>()

  for (const player of players) {
    if (!player.uid) continue
    counts.set(player.uid, { playerName: player.displayName, count: 0 })
  }

  for (const find of finds) {
    if (!find.playerId) continue
    const current = counts.get(find.playerId)
    if (current) {
      counts.set(find.playerId, {
        playerName: current.playerName || find.playerName,
        count: current.count + 1,
      })
    } else {
      counts.set(find.playerId, { playerName: find.playerName, count: 1 })
    }
  }

  return [...counts.entries()]
    .map(([playerId, row]) => ({ playerId, ...row }))
    .sort((a, b) => b.count - a.count || a.playerName.localeCompare(b.playerName))
}

export function leadingFindCount(rows: readonly PlayerTally[]): number {
  return rows[0]?.count ?? 0
}
