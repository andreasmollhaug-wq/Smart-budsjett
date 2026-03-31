'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PasswordChangeForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (next.length < 8) {
      setMessage('Nytt passord må ha minst 8 tegn.')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user?.email) {
        setMessage('Fant ikke innlogget bruker.')
        return
      }
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      })
      if (signErr) {
        setMessage('Feil nåværende passord.')
        return
      }
      const { error } = await supabase.auth.updateUser({ password: next })
      if (error) {
        setMessage(error.message)
        return
      }
      setMessage('Passordet er oppdatert.')
      setCurrent('')
      setNext('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-md">
      <div>
        <label htmlFor="pw-current" className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
          Nåværende passord
        </label>
        <input
          id="pw-current"
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm"
          style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          autoComplete="current-password"
          required
        />
      </div>
      <div>
        <label htmlFor="pw-new" className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
          Nytt passord
        </label>
        <input
          id="pw-new"
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm"
          style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      {message && (
        <p className="text-sm" style={{ color: message.startsWith('Passordet') ? 'var(--primary)' : '#c92a2a' }}>
          {message}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-60"
        style={{ background: 'var(--primary)' }}
      >
        {loading ? 'Oppdaterer…' : 'Oppdater passord'}
      </button>
    </form>
  )
}
