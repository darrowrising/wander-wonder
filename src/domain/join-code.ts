export const JOIN_CODE_PATTERN = /^[A-Z]{3}-[0-9]{3}$/

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const DIGITS = '23456789'

export function createJoinCode(): string {
  const letters = Array.from({ length: 3 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('')
  const digits = Array.from({ length: 3 }, () => DIGITS[Math.floor(Math.random() * DIGITS.length)]).join('')
  return `${letters}-${digits}`
}

export function normalizeJoinCode(raw: string): string {
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (compact.length !== 6) return raw.trim().toUpperCase()
  return `${compact.slice(0, 3)}-${compact.slice(3)}`
}
