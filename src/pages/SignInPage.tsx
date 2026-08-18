import { useState, type FormEvent } from 'react'
import { product } from '@/config/product'
import { useAuth } from '@/auth/AuthProvider'
import { authErrorMessage } from '@/auth/errors'
import { BrandMark } from '@/components/BrandMark'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SignInPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password, displayName.trim() || email.split('@')[0] || 'Player')
      }
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function onGoogle() {
    setBusy(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-4 py-10">
      <BrandMark as="heading" className="text-4xl leading-tight" />
      <p className="mt-3 text-xl font-medium tracking-tight text-stone-700">{product.tagline}</p>
      <p className="mt-2 text-stone-600">Sign in to create or join a family trip.</p>

      <Button className="mt-8 w-full" size="lg" onClick={() => void onGoogle()} disabled={busy}>
        Continue with Google
      </Button>

      <div className="my-6 flex items-center gap-3 text-sm text-stone-400">
        <div className="h-px flex-1 bg-stone-200" />
        or email
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      <form className="flex flex-col gap-4" onSubmit={(event) => void onSubmit(event)}>
        {mode === 'signup' && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Grandma" />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Button type="submit" variant="outline" disabled={busy}>
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </Button>
      </form>

      <button
        type="button"
        className="mt-4 cursor-pointer text-sm text-emerald-800"
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
      >
        {mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}
