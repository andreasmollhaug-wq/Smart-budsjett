import type { ReactNode } from 'react'
import BrandLogoMark from '@/components/brand/BrandLogoMark'

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
}

/** Felles layout for offentlige auth-sider (innlogging, tofaktor, …). */
export default function AuthFormShell({ title, subtitle, children }: Props) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{
        background: 'var(--bg)',
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-sm min-w-0"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="mb-8 text-center min-w-0">
          <div className="mx-auto mb-4 flex justify-center">
            <BrandLogoMark size="xl" alt="" />
          </div>
          <h1 className="text-xl font-bold break-words" style={{ color: 'var(--text)' }}>
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm break-words" style={{ color: 'var(--text-muted)' }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="min-w-0 overflow-x-hidden">{children}</div>
      </div>
    </div>
  )
}
