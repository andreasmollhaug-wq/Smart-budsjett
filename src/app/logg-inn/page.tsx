'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { safeRedirectPath } from '@/lib/safeRedirectPath'
import AuthLoadingCard from '@/components/auth/AuthLoadingCard'

const schema = z.object({
  email: z.string().min(1, 'E-post er påkrevd').email('Ugyldig e-post'),
  password: z.string().min(1, 'Passord er påkrevd'),
})

type FormValues = z.infer<typeof schema>

function authCallbackErrorMessage(code: string | null): string | null {
  switch (code) {
    case 'missing_code':
      return 'Innloggingslenken var ugyldig eller utløpt. Prøv å logge inn på nytt, eller be om ny lenke under glemt passord.'
    case 'session':
      return 'Vi kunne ikke etablere økt fra lenken. Prøv å logge inn på nytt, eller bruk glemt passord hvis du skulle tilbakestille.'
    default:
      return null
  }
}

function LoggInnForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeRedirectPath(searchParams.get('next'))
  const configError = searchParams.get('error') === 'config'
  const callbackError = authCallbackErrorMessage(searchParams.get('error'))

  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email.trim(),
        password: values.password,
      })
      if (error) {
        setServerError(
          error.message.includes('Invalid login credentials')
            ? 'Feil e-post eller passord.'
            : error.message,
        )
        return
      }
      router.push(next)
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
            Logg inn
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            Smart Budsjett
          </p>
        </div>

        {configError && (
          <p className="mb-4 rounded-xl px-3 py-2 text-sm" style={{ background: '#fff4f4', color: '#c92a2a' }}>
            Mangler Supabase-konfigurasjon. Legg til NEXT_PUBLIC_SUPABASE_URL og NEXT_PUBLIC_SUPABASE_ANON_KEY i
            .env.local.
          </p>
        )}

        {callbackError && !configError && (
          <p className="mb-4 rounded-xl px-3 py-2 text-sm" style={{ background: '#fff4f4', color: '#c92a2a' }}>
            {callbackError}
          </p>
        )}

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
              autoComplete="current-password"
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs" style={{ color: '#c92a2a' }}>
                {errors.password.message}
              </p>
            )}
            <p className="mt-2 text-right">
              <Link href="/glemt-passord" className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
                Glemt passord?
              </Link>
            </p>
          </div>
          {serverError && (
            <p className="text-sm" style={{ color: '#c92a2a' }}>
              {serverError}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #3B5BDB, #4C6EF5)' }}
          >
            {loading ? 'Logger inn…' : 'Logg inn'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Har du ikke konto?{' '}
          <Link href="/registrer" className="font-medium" style={{ color: 'var(--primary)' }}>
            Registrer deg
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

export default function LoggInnPage() {
  return (
    <Suspense fallback={<AuthLoadingCard label="Laster innlogging…" />}>
      <LoggInnForm />
    </Suspense>
  )
}
