const contentPad =
  'pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))]'
const headerPad =
  'pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] lg:pl-[max(2rem,env(safe-area-inset-left))] lg:pr-[max(2rem,env(safe-area-inset-right))]'

export default function ForumLoading() {
  return (
    <div
      className="flex flex-1 flex-col overflow-y-auto pb-24 sm:pb-28"
      aria-busy="true"
      aria-live="polite"
    >
      <div
        className={`flex min-w-0 flex-col gap-3 border-b py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-5 ${headerPad}`}
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-7 w-[min(12rem,55vw)] rounded-md animate-pulse" style={{ background: 'var(--bg)' }} />
          <div className="h-4 w-[min(20rem,90vw)] max-w-full rounded-md animate-pulse" style={{ background: 'var(--bg)' }} />
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="size-10 shrink-0 rounded-full animate-pulse" style={{ background: 'var(--bg)' }} />
          <div className="size-10 shrink-0 rounded-full animate-pulse" style={{ background: 'var(--bg)' }} />
        </div>
      </div>

      <div className={`min-w-0 flex-1 space-y-6 py-5 pb-8 sm:py-8 ${contentPad}`}>
        <div
          className="h-12 w-full max-w-2xl rounded-xl animate-pulse"
          style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
        />
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_minmax(16rem,20rem)] lg:gap-x-8">
          <div className="space-y-3 min-h-[12rem]">
            <div className="h-5 w-32 rounded animate-pulse" style={{ background: 'var(--bg)' }} />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-[4.5rem] w-full rounded-xl animate-pulse"
                  style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-3 min-h-[10rem]">
            <div className="h-5 w-36 rounded animate-pulse" style={{ background: 'var(--bg)' }} />
            <div
              className="h-40 w-full rounded-xl animate-pulse"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
