import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { ensureUserProfile } from '@/data/trips'
import { auth, googleProvider } from '@/lib/firebase'
import type { UserProfile } from '@/domain/trip'

type AuthState = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

function toProfile(user: User, fallbackName?: string): UserProfile {
  return {
    uid: user.uid,
    displayName: user.displayName || fallbackName || user.email?.split('@')[0] || 'Player',
    email: user.email,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (next) => {
      setUser(next)
      setLoading(false)
      if (next) {
        void ensureUserProfile(toProfile(next))
      }
    })
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      profile: user ? toProfile(user) : null,
      loading,
      signInWithGoogle: async () => {
        await signInWithPopup(auth, googleProvider)
      },
      signInWithEmail: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password)
      },
      signUpWithEmail: async (email, password, displayName) => {
        const credential = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(credential.user, { displayName })
        await ensureUserProfile(toProfile(credential.user, displayName))
      },
      signOut: () => firebaseSignOut(auth),
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
