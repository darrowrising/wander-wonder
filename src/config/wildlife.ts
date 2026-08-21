import type { ExtraRarity } from '@/domain/extra-credit'

export type WildlifeKind = 'animal' | 'sign'

export type WildlifeItem = {
  id: string
  name: string
  kind: WildlifeKind
  rarity: ExtraRarity
}

export const wildlifeAnimals: WildlifeItem[] = [
  { id: 'elk', name: 'Elk', kind: 'animal', rarity: 'common' },
  { id: 'bison', name: 'Bison', kind: 'animal', rarity: 'common' },
  { id: 'mule-deer', name: 'Mule deer', kind: 'animal', rarity: 'common' },
  { id: 'pronghorn', name: 'Pronghorn', kind: 'animal', rarity: 'common' },
  { id: 'raven', name: 'Raven', kind: 'animal', rarity: 'common' },
  { id: 'magpie', name: 'Black-billed magpie', kind: 'animal', rarity: 'common' },
  { id: 'moose', name: 'Moose', kind: 'animal', rarity: 'uncommon' },
  { id: 'bald-eagle', name: 'Bald eagle', kind: 'animal', rarity: 'uncommon' },
  { id: 'osprey', name: 'Osprey', kind: 'animal', rarity: 'uncommon' },
  { id: 'coyote', name: 'Coyote', kind: 'animal', rarity: 'uncommon' },
  { id: 'beaver', name: 'Beaver', kind: 'animal', rarity: 'uncommon' },
  { id: 'black-bear', name: 'Black bear', kind: 'animal', rarity: 'rare' },
  { id: 'grizzly', name: 'Grizzly bear', kind: 'animal', rarity: 'rare' },
  { id: 'red-fox', name: 'Red fox', kind: 'animal', rarity: 'rare' },
  { id: 'trumpeter-swan', name: 'Trumpeter swan', kind: 'animal', rarity: 'rare' },
]

export const wildlifeSigns: WildlifeItem[] = [
  { id: 'tracks', name: 'Tracks', kind: 'sign', rarity: 'common' },
  { id: 'crossing-sign', name: 'Wildlife crossing sign', kind: 'sign', rarity: 'common' },
  { id: 'scat', name: 'Scat', kind: 'sign', rarity: 'uncommon' },
  { id: 'wildlife-jam', name: 'Wildlife jam', kind: 'sign', rarity: 'uncommon' },
  { id: 'bugle', name: 'Elk bugle', kind: 'sign', rarity: 'rare' },
]

export const wildlifeItems: WildlifeItem[] = [...wildlifeAnimals, ...wildlifeSigns]

export const wildlifeById = Object.fromEntries(wildlifeItems.map((item) => [item.id, item])) as Record<
  string,
  WildlifeItem
>
