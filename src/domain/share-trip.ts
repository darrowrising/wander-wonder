const NAME_MAX = 80
const DATE_MAX = 48

export type TripShareInput = {
  origin: string
  tripId: string
  name: string
  dateRange?: string
}

export function tripShareTitle(name: string): string {
  const trimmed = name.trim()
  return trimmed ? `${trimmed} · Wander Wonder` : 'Wander Wonder'
}

export function tripShareLink(input: TripShareInput): string {
  const origin = input.origin.replace(/\/$/, '')
  const url = new URL(`/trips/${input.tripId}`, `${origin}/`)
  const name = input.name.trim().slice(0, NAME_MAX)
  const dateRange = input.dateRange?.trim().slice(0, DATE_MAX)
  if (name) url.searchParams.set('n', name)
  if (dateRange) url.searchParams.set('d', dateRange)
  return url.toString()
}

export function tripShareClipboard(input: TripShareInput): string {
  return tripShareLink(input)
}

export function tripShareMetaFromUrl(url: URL): { name: string; dateRange?: string; pageUrl: string } | null {
  const match = url.pathname.match(/^\/trips\/([^/]+)\/?$/)
  if (!match || match[1] === 'new') return null
  const name = url.searchParams.get('n')?.trim().slice(0, NAME_MAX)
  if (!name) return null
  const dateRange = url.searchParams.get('d')?.trim().slice(0, DATE_MAX) || undefined
  return { name, dateRange, pageUrl: url.toString() }
}

export function applyTripShareMeta(
  html: string,
  meta: { name: string; dateRange?: string; pageUrl: string },
): string {
  const title = tripShareTitle(meta.name)
  const description = meta.dateRange
    ? `${meta.name} · ${meta.dateRange}. Join this family hunt on Wander Wonder.`
    : `Join ${meta.name} on Wander Wonder. Family adventure games for the road.`

  let next = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`)
  next = setMeta(next, 'property', 'og:title', title)
  next = setMeta(next, 'property', 'og:description', description)
  next = setMeta(next, 'property', 'og:url', meta.pageUrl)
  next = setMeta(next, 'property', 'og:image:alt', `${meta.name} — Wander Wonder`)
  next = setMeta(next, 'name', 'twitter:title', title)
  next = setMeta(next, 'name', 'twitter:description', description)
  next = setMeta(next, 'name', 'twitter:image:alt', `${meta.name} — Wander Wonder`)
  next = setMeta(next, 'name', 'description', description)
  next = next.replace(/(<link\s+rel="canonical"\s+href=")([^"]*)(")/i, `$1${escapeHtml(meta.pageUrl)}$3`)
  return next
}

function setMeta(html: string, kind: 'property' | 'name', tag: string, value: string): string {
  const escaped = escapeHtml(value)
  const re = new RegExp(`(<meta\\b[^>]*\\b${kind}="${tag}"[^>]*\\bcontent=")([^"]*)(")`, 'i')
  return re.test(html) ? html.replace(re, `$1${escaped}$3`) : html
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
