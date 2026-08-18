import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTrip } from '@/data/trips'

export function NewTripPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!profile) return
    setBusy(true)
    setError(null)
    try {
      const trip = await createTrip({ name: name.trim(), startDate, endDate, host: profile })
      navigate(`/trips/${trip.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create trip.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="mx-auto flex max-w-md flex-col gap-4" onSubmit={(event) => void onSubmit(event)}>
      <h1 className="text-2xl font-semibold">New trip</h1>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="trip-name">Name</Label>
        <Input id="trip-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Grand Teton 2026" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="start">Start</Label>
        <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="end">End</Label>
        <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={busy}>
        Create trip
      </Button>
    </form>
  )
}
