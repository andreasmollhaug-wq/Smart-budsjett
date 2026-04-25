'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const schema = z
  .object({
    email: z.string().min(1, 'E-post er påkrevd').email('Ugyldig e-post'),
    password: z.string().min(8, 'Passord må ha minst 8 tegn'),
    confirm: z.string().min(1, 'Bekreft passord'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passordene er ikke like',
    path: ['confirm'],
  })

type FormValues = z.infer<typeof schema>

export default function RegistrerPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const afterConfirmPath = '/konto/betalinger?trial=welcome'
      const { data, error } = await supabase.auth.signUp({
        email: values.email.trim(),
        password: values.password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(afterConfirmPath)}`,
        },
      })
      if (error) {
        setServerError(error.message)
        return
      }
      if (data.session) {
        router.push(afterConfirmPath)
        router.refresh()
        return
      }
      setSuccess(
        'Konto opprettet. Vi har sendt en bekreftelseslenke til e-posten din. Det kan ta 1–5 minutter før den kommer. Sjekk innboksen og søppelpost (evt. «Reklame»/promotions). Du kan også logge inn hvis bekreftelse ikke er påkrevd.',
      )
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-sm"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
          >
            SB
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            Opprett konto
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Smart Budsjett — gratis å starte
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              E-post
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              {...register('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs" style={{ color: '#c92a2a' }}>
                {errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Passord
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs" style={{ color: '#c92a2a' }}>
                {errors.password.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1 block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Bekreft passord
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              {...register('confirm')}
            />
            {errors.confirm && (
              <p className="mt-1 text-xs" style={{ color: '#c92a2a' }}>
                {errors.confirm.message}
              </p>
            )}
          </div>
          {serverError && (
            <p className="text-sm" style={{ color: '#c92a2a' }}>
              {serverError}
            </p>
          )}
          {success && (
            <p className="rounded-xl px-3 py-2 text-sm" style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}>
              {success}
            </p>
          )}
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Ved å registrere deg godtar du våre{' '}
            <Link href="/vilkar" className="underline" style={{ color: 'var(--primary)' }}>
              vilkår
            </Link>{' '}
            og{' '}
            <Link href="/personvern" className="underline" style={{ color: 'var(--primary)' }}>
              personvernregler
            </Link>
            .
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
          >
            {loading ? 'Oppretter…' : 'Registrer deg'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Har du allerede konto?{' '}
          <Link
            href={`/logg-inn?next=${encodeURIComponent('/konto/betalinger?trial=welcome')}`}
            className="font-medium"
            style={{ color: 'var(--primary)' }}
          >
            Logg inn
          </Link>
        </p>
        <p className="mt-4 text-center">
          <Link href="/" className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Tilbake til forsiden
          </Link>
        </p>
      </div>
    </div>
  )
}
