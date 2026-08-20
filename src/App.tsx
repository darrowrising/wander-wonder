import { useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/auth/AuthProvider'
import { isAdminEmail } from '@/config/admin'
import { AdminPage } from '@/pages/AdminPage'
import { AppShell } from '@/pages/AppShell'
import { HomePage } from '@/pages/HomePage'
import { LoadingPage, STARTUP_HOLD_MS } from '@/pages/LoadingPage'
import { NewTripPage } from '@/pages/NewTripPage'
import { SignInPage } from '@/pages/SignInPage'
import { TripPage } from '@/pages/TripPage'

function useStartupHold(ms: number) {
  const [done, setDone] = useState(false)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = window.setTimeout(() => setDone(true), reduced ? 0 : ms)
    return () => window.clearTimeout(id)
  }, [ms])

  return done
}

function Gate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const [params] = useSearchParams()
  const pinSplash = params.has('splash')
  const splashDone = useStartupHold(STARTUP_HOLD_MS)
  if (loading || !splashDone || pinSplash) {
    return <LoadingPage />
  }
  if (!user) {
    return <SignInPage />
  }
  return children
}

function AdminGate({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  if (!isAdminEmail(profile?.email)) {
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Gate>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/trips/new" element={<NewTripPage />} />
              <Route path="/trips/:tripId" element={<TripPage />} />
              <Route
                path="/admin"
                element={
                  <AdminGate>
                    <AdminPage />
                  </AdminGate>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Gate>
      </BrowserRouter>
    </AuthProvider>
  )
}
