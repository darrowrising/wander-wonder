import { Outlet } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { BrandMark } from '@/components/BrandMark'
import { Button } from '@/components/ui/button'

export function AppShell() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-svh">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <BrandMark as="link" className="text-xl" />
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-stone-500 sm:inline">{profile?.displayName}</span>
            <Button variant="ghost" size="sm" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
