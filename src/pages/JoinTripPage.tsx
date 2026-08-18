import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { joinTripByCode } from '@/data/trips'
import { normalizeJoinCode } from '@/domain/join-code'

export function JoinTripPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!profile) return
    setBusy(true)
    setError(null)
    try {
      const tripId = await joinTripByCode(normalizeJoinCode(code), profile)
      navigate(`/trips/${tripId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join trip.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="mx-auto flex max-w-md flex-col gap-4" onSubmit={(event) => void onSubmit(event)}>
      <h1 className="text-2xl font-semibold">Join a trip</h1>
      <p className="text-sm text-sand-600">Enter the code someone sent you. You need a network connection this once.</p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="code">Trip code</Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABC-123"
          autoCapitalize="characters"
          required
        />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={busy}>
        Join
      </Button>
    </form>
  )
}
