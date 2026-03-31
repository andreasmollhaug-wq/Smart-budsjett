export default function LandingPositioning() {
  return (
    <section className="px-4 py-12 sm:px-6">
      <div
        className="mx-auto max-w-3xl rounded-2xl p-8 text-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-xl font-bold sm:text-2xl" style={{ color: 'var(--text)' }}>
          Ikke avansert økonomistyring
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-muted)' }}>
          Målet er å skape <strong style={{ color: 'var(--text)' }}>oversikt</strong>, gi deg{' '}
          <strong style={{ color: 'var(--text)' }}>kontroll</strong>, og gjøre økonomi{' '}
          <strong style={{ color: 'var(--text)' }}>enkelt å forholde seg til</strong> — uten at du må være økonom for å komme i gang.
        </p>
      </div>
    </section>
  )
}
