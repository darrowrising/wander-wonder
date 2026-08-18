import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/auth/AuthProvider'
import { AppShell } from '@/pages/AppShell'
import { HomePage } from '@/pages/HomePage'
import { ImportPage } from '@/pages/ImportPage'
import { JoinTripPage } from '@/pages/JoinTripPage'
import { NewTripPage } from '@/pages/NewTripPage'
import { SignInPage } from '@/pages/SignInPage'
import { TripPage } from '@/pages/TripPage'

function Gate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return <p className="p-8 text-center text-stone-500">Loading…</p>
  }
  if (!user) {
    return <SignInPage />
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
              <Route path="/join" element={<JoinTripPage />} />
              <Route path="/import" element={<ImportPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Gate>
      </BrowserRouter>
    </AuthProvider>
  )
}
