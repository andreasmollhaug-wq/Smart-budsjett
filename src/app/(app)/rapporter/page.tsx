import Link from 'next/link'
import Header from '@/components/layout/Header'
import { FileText, Target, ChevronRight } from 'lucide-react'

export default function RapporterPage() {
  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header title="Rapporter" subtitle="Eksporter og del økonomisk oversikt" />
      <div className="p-8 max-w-2xl flex flex-col gap-4">
        <Link
          href="/rapporter/bank"
          className="flex items-center gap-4 p-6 rounded-2xl transition-colors hover:opacity-95"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
          >
            <FileText size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
              Rapport til bank
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Gjeld, sparing, investeringer og budsjett mot faktiske tall for valgt måned. Skriv ut eller lagre som
              PDF.
            </p>
          </div>
          <ChevronRight size={20} style={{ color: 'var(--primary)' }} className="shrink-0" />
        </Link>
        <Link
          href="/rapporter/sparemal"
          className="flex items-center gap-4 p-6 rounded-2xl transition-colors hover:opacity-95"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}
          >
            <Target size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
              Sparemålrapport
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Oversikt over alle sparemål, fremdrift som på sparesiden, fordeling mellom mål og nylig aktivitet. Skriv
              ut eller lagre som PDF.
            </p>
          </div>
          <ChevronRight size={20} style={{ color: 'var(--primary)' }} className="shrink-0" />
        </Link>
      </div>
    </div>
  )
}
