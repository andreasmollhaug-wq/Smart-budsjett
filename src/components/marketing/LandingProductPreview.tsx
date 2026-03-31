export default function LandingProductPreview() {
  return (
    <section className="px-4 pb-14 pt-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text)' }}>
          Slik ser oversikten ut
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
          Ryddig dashboard med tall og grafer — samme rolige uttrykk som i resten av appen.
        </p>

        <div
          className="mt-10 overflow-hidden rounded-2xl"
          style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
        >
          <div
            className="p-6 text-white"
            style={{ background: 'linear-gradient(135deg, #3B5BDB 0%, #4C6EF5 50%, #7048E8 100%)' }}
          >
            <p className="text-sm font-medium opacity-80">Total oversikt</p>
            <p className="mt-1 text-3xl font-bold">Din økonomi i dag</p>
            <p className="mt-1 text-sm opacity-80">Inntekt, utgifter og mål på ett sted</p>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-3">
            {[
              { label: 'Inntekt', tone: 'var(--primary)' },
              { label: 'Utgifter', tone: 'var(--danger)' },
              { label: 'Igjen', tone: 'var(--success)' },
            ].map(({ label, tone }) => (
              <div
                key={label}
                className="rounded-xl p-4"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  {label}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full" style={{ background: 'var(--primary-pale)' }}>
                  <div className="h-full w-2/3 rounded-full" style={{ background: tone }} />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t px-6 py-8" style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
            <div className="flex h-36 items-end justify-between gap-2">
              {[40, 65, 45, 80, 55, 70].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-md opacity-90"
                  style={{
                    height: `${h}%`,
                    background: i % 2 === 0 ? 'var(--primary)' : 'var(--accent)',
                  }}
                />
              ))}
            </div>
            <p className="mt-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Illustrasjon — tall i appen baseres på dine egne registreringer
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
