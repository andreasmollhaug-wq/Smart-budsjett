'use client'

type Props = {
  onAddCreditor: () => void
  readOnly?: boolean
}

export default function CreditorRegistryEmptyState({ onAddCreditor, readOnly }: Props) {
  return (
    <div
      className="rounded-2xl p-8 text-center max-w-lg mx-auto"
      style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}
    >
      <p className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
        Ingen kreditorer registrert ennå
      </p>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        Start med å legge til en kreditor — f.eks. bank, SVEA eller kredittkortleverandør. Deretter legger du inn lån
        under hver kreditor.
      </p>
      <button
        type="button"
        onClick={onAddCreditor}
        disabled={readOnly}
        className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 text-sm font-medium touch-manipulation text-white disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: 'var(--primary)' }}
      >
        Legg til første kreditor
      </button>
    </div>
  )
}
