import { describe, expect, it } from 'vitest'
import {
  applyTripShareMeta,
  tripShareClipboard,
  tripShareLink,
  tripShareMetaFromUrl,
  tripShareTitle,
} from './share-trip'

const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <title>Wander Wonder</title>
    <meta name="description" content="Play where you are." />
    <link rel="canonical" href="https://example.com/" />
    <meta property="og:site_name" content="Wander Wonder" />
    <meta property="og:url" content="https://example.com/" />
    <meta property="og:title" content="Wander Wonder" />
    <meta
      property="og:description"
      content="Play where you are. Family adventure games for road trips, parks, and wherever you wander."
    />
    <meta property="og:image:alt" content="Wander Wonder — Play where you are." />
    <meta name="twitter:title" content="Wander Wonder" />
    <meta name="twitter:description" content="Play where you are." />
    <meta name="twitter:image:alt" content="Wander Wonder — Play where you are." />
  </head>
</html>
`

describe('trip share payload', () => {
  it('copies only the shareable trip link', () => {
    const link = tripShareLink({
      origin: 'https://wander-wonder.vercel.app',
      tripId: 'abc',
      name: 'Grand Teton 2026',
      dateRange: 'Sep 15 – Sep 20, 2026',
    })
    expect(link).toContain('/trips/abc')
    expect(link).toContain('n=Grand+Teton+2026')
    expect(tripShareClipboard({
      origin: 'https://wander-wonder.vercel.app',
      tripId: 'abc',
      name: 'Grand Teton 2026',
      dateRange: 'Sep 15 – Sep 20, 2026',
    })).toBe(link)
  })

  it('builds a preview title from the trip name', () => {
    expect(tripShareTitle('Grand Teton 2026')).toBe('Grand Teton 2026 · Wander Wonder')
  })
})

describe('tripShareMetaFromUrl', () => {
  it('reads the name from a shared trip URL', () => {
    const meta = tripShareMetaFromUrl(
      new URL('https://wander-wonder.vercel.app/trips/abc?n=Grand%20Teton%202026&d=Sep%2015%20%E2%80%93%20Sep%2020%2C%202026'),
    )
    expect(meta?.name).toBe('Grand Teton 2026')
    expect(meta?.dateRange).toContain('Sep 15')
  })

  it('ignores the new-trip page and links without a name', () => {
    expect(tripShareMetaFromUrl(new URL('https://wander-wonder.vercel.app/trips/new?n=Nope'))).toBeNull()
    expect(tripShareMetaFromUrl(new URL('https://wander-wonder.vercel.app/trips/abc'))).toBeNull()
  })
})

describe('applyTripShareMeta', () => {
  it('rewrites Open Graph tags so iMessage can show the trip name', () => {
    const html = applyTripShareMeta(indexHtml, {
      name: 'Grand Teton 2026',
      dateRange: 'Sep 15 – Sep 20, 2026',
      pageUrl: 'https://wander-wonder.vercel.app/trips/abc?n=Grand+Teton+2026',
    })
    expect(html).toContain('<title>Grand Teton 2026 · Wander Wonder</title>')
    expect(html).toContain('property="og:title" content="Grand Teton 2026 · Wander Wonder"')
    expect(html).toContain('Grand Teton 2026 · Sep 15 – Sep 20, 2026')
    expect(html).toContain('property="og:site_name" content="Wander Wonder"')
  })
})
