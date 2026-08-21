import type { Country, FoundPlate } from './plates'

export type ExtraRarity = 'common' | 'uncommon' | 'rare'

export const POINTS: Record<ExtraRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
}

export function pointsForRarity(rarity: ExtraRarity): number {
  return POINTS[rarity]
}

const USA_RARITY: Record<string, ExtraRarity> = {
  California: 'common',
  Texas: 'common',
  Florida: 'common',
  'New York': 'common',
  Pennsylvania: 'common',
  Ohio: 'common',
  Illinois: 'common',
  Michigan: 'common',
  Georgia: 'common',
  'North Carolina': 'common',
  'New Jersey': 'common',
  Virginia: 'common',
  Washington: 'common',
  Arizona: 'common',
  Colorado: 'common',
  Tennessee: 'common',
  Indiana: 'common',
  Missouri: 'common',
  Maryland: 'common',
  Wisconsin: 'common',
  Minnesota: 'common',
  Massachusetts: 'common',
  Alabama: 'common',
  'South Carolina': 'common',
  Hawaii: 'rare',
  Alaska: 'rare',
  'Rhode Island': 'rare',
  Delaware: 'rare',
  Vermont: 'rare',
  'North Dakota': 'rare',
  'South Dakota': 'rare',
  Wyoming: 'rare',
  Montana: 'rare',
  Maine: 'rare',
  'New Hampshire': 'rare',
  'West Virginia': 'rare',
}

const CANADA_RARITY: Record<string, ExtraRarity> = {
  Ontario: 'common',
  Quebec: 'common',
  'British Columbia': 'common',
  Alberta: 'common',
  Manitoba: 'uncommon',
  Saskatchewan: 'uncommon',
  'Nova Scotia': 'uncommon',
  'New Brunswick': 'uncommon',
  'Prince Edward Island': 'rare',
  'Newfoundland and Labrador': 'rare',
  Yukon: 'rare',
  'Northwest Territories': 'rare',
  Nunavut: 'rare',
}

const MEXICO_RARITY: Record<string, ExtraRarity> = {
  'Baja California Norte': 'common',
  Sonora: 'common',
  Chihuahua: 'common',
  Coahuila: 'common',
  'Nuevo León': 'common',
  Tamaulipas: 'common',
  'Baja California Sur': 'uncommon',
  Sinaloa: 'uncommon',
  Durango: 'uncommon',
  Zacatecas: 'uncommon',
  'San Luis Potosí': 'uncommon',
  Jalisco: 'uncommon',
  Nayarit: 'uncommon',
}

export function plateRarity(country: Country, state: string): ExtraRarity {
  if (country === 'usa') return USA_RARITY[state] ?? 'uncommon'
  if (country === 'canada') return CANADA_RARITY[state] ?? 'uncommon'
  return MEXICO_RARITY[state] ?? 'rare'
}

export function extraCreditRarity(country: Country, state: string): ExtraRarity | null {
  if (country === 'usa') return null
  return plateRarity(country, state)
}

export function extraCreditPoints(country: Country, state: string): number {
  const rarity = extraCreditRarity(country, state)
  return rarity ? POINTS[rarity] : 0
}

const FOUND_PERCENT: Record<string, number> = {
  'usa:California': 84,
  'usa:Texas': 80,
  'usa:Florida': 76,
  'usa:New York': 70,
  'usa:Pennsylvania': 66,
  'usa:Ohio': 63,
  'usa:Illinois': 62,
  'usa:Michigan': 60,
  'usa:Georgia': 58,
  'usa:Hawaii': 4,
  'usa:Alaska': 6,
  'usa:Rhode Island': 7,
  'usa:Delaware': 8,
  'usa:Vermont': 9,
  'usa:Wyoming': 11,
  'canada:Ontario': 38,
  'canada:Quebec': 22,
  'canada:Nunavut': 3,
  'mexico:Sonora': 24,
  'mexico:Yucatán': 5,
}

const FOUND_PERCENT_RANGE: Record<ExtraRarity, readonly [number, number]> = {
  rare: [4, 14],
  uncommon: [20, 40],
  common: [50, 86],
}

function unitHash(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return ((hash >>> 0) % 1000) / 999
}

export function plateFoundPercent(country: Country, state: string): number {
  const key = `${country}:${state}`
  const known = FOUND_PERCENT[key]
  if (known != null) return known
  const [min, max] = FOUND_PERCENT_RANGE[plateRarity(country, state)]
  return Math.round(min + unitHash(key) * (max - min))
}

export type ExtraCreditSummary = {
  points: number
  canada: number
  mexico: number
  rareFinds: number
  bothBorders: boolean
  northAmerica: boolean
}

export function summarizeExtraCredit(found: Map<string, FoundPlate>): ExtraCreditSummary {
  let points = 0
  let canada = 0
  let mexico = 0
  let rareFinds = 0
  let usa = 0

  for (const plate of found.values()) {
    if (plate.country === 'usa') {
      usa += 1
      continue
    }
    const rarity = extraCreditRarity(plate.country, plate.state)
    points += extraCreditPoints(plate.country, plate.state)
    if (rarity === 'rare') rareFinds += 1
    if (plate.country === 'canada') canada += 1
    else mexico += 1
  }

  return {
    points,
    canada,
    mexico,
    rareFinds,
    bothBorders: canada > 0 && mexico > 0,
    northAmerica: usa > 0 && canada > 0 && mexico > 0,
  }
}
