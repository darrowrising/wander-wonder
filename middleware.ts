import { applyTripShareMeta, tripShareMetaFromUrl } from './src/domain/share-trip'

export const config = {
  matcher: '/trips/:path*',
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  const meta = tripShareMetaFromUrl(new URL(request.url))
  if (!meta) return undefined

  const index = await fetch(new URL('/', request.url))
  if (!index.ok) return undefined

  const html = applyTripShareMeta(await index.text(), meta)
  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, s-maxage=300, stale-while-revalidate=86400',
    },
  })
}
