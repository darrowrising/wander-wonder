import { Outlet, useLocation } from 'react-router-dom'
import { AccountDrawer } from '@/components/AccountDrawer'
import { BrandMark } from '@/components/BrandMark'
import { OfflineBanner } from '@/components/OfflineBanner'
import { cn } from '@/lib/utils'

export function AppShell() {
  const { pathname } = useLocation()
  const onTripPage = /^\/trips\/(?!new$).+/.test(pathname)

  return (
    <div className="min-h-svh">
      <header className="border-b border-sand-200 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <BrandMark as="link" showLogo={false} className="text-xl" />
          <AccountDrawer />
        </div>
      </header>
      <OfflineBanner />
      <main className={cn('mx-auto max-w-3xl px-4 pb-6', onTripPage ? 'pt-3' : 'pt-6')}>
        <Outlet />
      </main>
    </div>
  )
}
