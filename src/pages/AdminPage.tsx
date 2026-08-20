import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'

export function AdminPage() {
  const { profile } = useAuth()

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="text-sm text-sand-600">
        Signed in as {profile?.email}. This page is hidden in the app and blocked in Firestore for
        everyone else.
      </p>
      <p className="text-sm text-sand-500">Tools will land here. Nothing extra is wired up yet.</p>
      <Link to="/" className="text-sm text-forest underline-offset-4 hover:underline">
        Back to trips
      </Link>
    </div>
  )
}
