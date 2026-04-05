'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronUp, Loader2, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/lib/store'
import { DEMO_FEATURE_REQUESTS, isDemoRoadmapId } from '@/lib/demoRoadmap'

const STATUS_ORDER = ['pending', 'approved', 'in_progress', 'done', 'rejected'] as const
type FeatureStatus = (typeof STATUS_ORDER)[number]

const STATUS_LABELS: Record<FeatureStatus, string> = {
  pending: 'Venter',
  approved: 'Godkjent',
  in_progress: 'Under arbeid',
  done: 'Ferdig',
  rejected: 'Avvist',
}

/** Tekst lenger enn dette kan utvides med «Vis mer». */
const BODY_PREVIEW_CHARS = 220

const formSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Tittelen må ha minst 3 tegn.')
    .max(120, 'Maks 120 tegn i tittel.'),
  body: z.string().max(4000, 'Beskrivelsen er for lang.').optional(),
})

type FormValues = z.infer<typeof formSchema>

interface FeatureRequestRow {
  id: string
  title: string
  body: string | null
  status: FeatureStatus
  vote_count: number
  created_by: string
  created_at: string
}

function formatCardDate(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

function RoadmapBoardSkeleton() {
  return (
    <div className="overflow-x-auto -mx-2 px-2 pb-2" aria-hidden>
      <div className="flex gap-3 min-w-max md:min-w-0 md:grid md:grid-cols-5 md:gap-4 items-start">
        {STATUS_ORDER.map((status) => (
          <div
            key={status}
            className="w-[min(92vw,280px)] shrink-0 md:w-auto md:min-w-0 flex flex-col gap-2"
          >
            <div className="h-4 w-24 rounded animate-pulse" style={{ background: 'var(--border)' }} />
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={`${status}-${i}`}
                  className="rounded-xl p-3 h-[88px] animate-pulse"
                  style={{ background: '#ffffff', border: '1px solid var(--border)' }}
                >
                  <div className="h-3 rounded mb-2 w-[85%]" style={{ background: 'var(--border)' }} />
                  <div className="h-2 w-full rounded mb-1" style={{ background: 'var(--border)' }} />
                  <div className="h-2 rounded w-[66%]" style={{ background: 'var(--border)' }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RequestCardBody({ body }: { body: string }) {
  const [expanded, setExpanded] = useState(false)
  const long = body.length > BODY_PREVIEW_CHARS

  return (
    <div className="mt-1">
      <p
        className={`text-xs whitespace-pre-wrap ${expanded ? '' : 'line-clamp-4'}`}
        style={{ color: 'var(--text-muted)' }}
      >
        {body}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-xs mt-1.5 font-medium hover:underline"
          style={{ color: 'var(--primary)' }}
        >
          {expanded ? 'Vis mindre' : 'Vis mer'}
        </button>
      )}
    </div>
  )
}

export default function KontoRoadmapPage() {
  const demoDataEnabled = useStore((s) => s.demoDataEnabled)
  const [rows, setRows] = useState<FeatureRequestRow[]>([])
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set())
  /** Lokale stemmetall for demo-kort (ikke persistert). */
  const [demoVoteCounts, setDemoVoteCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [sortBy, setSortBy] = useState<'votes' | 'newest'>('votes')
  const [searchQuery, setSearchQuery] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '', body: '' },
  })

  useEffect(() => {
    if (!submitSuccess) return
    const t = window.setTimeout(() => setSubmitSuccess(false), 6000)
    return () => window.clearTimeout(t)
  }, [submitSuccess])

  const loadData = useCallback(async () => {
    setLoadError(null)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      setLoadError('Du må være innlogget.')
      return
    }

    const [reqRes, voteRes] = await Promise.all([
      supabase.from('feature_request').select('*').order('created_at', { ascending: false }),
      supabase.from('feature_vote').select('request_id').eq('user_id', user.id),
    ])

    if (reqRes.error) {
      console.error('[roadmap]', reqRes.error)
      setLoadError(
        'Kunne ikke laste roadmap. Har du kjørt database-migrasjonen (feature_request) i Supabase?',
      )
      setRows([])
      setLoading(false)
      return
    }

    if (voteRes.error) {
      console.error('[roadmap] votes', voteRes.error)
    }

    const list = (reqRes.data ?? []) as FeatureRequestRow[]
    setRows(list)
    const vs = new Set<string>()
    for (const v of voteRes.data ?? []) {
      if (v && typeof (v as { request_id?: string }).request_id === 'string') {
        vs.add((v as { request_id: string }).request_id)
      }
    }
    setVotedIds(vs)
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const rowsForUi = useMemo(() => {
    if (!demoDataEnabled) return rows
    const demoWithVotes: FeatureRequestRow[] = DEMO_FEATURE_REQUESTS.map((r) => ({
      ...r,
      vote_count: demoVoteCounts[r.id] ?? r.vote_count,
    }))
    return [...demoWithVotes, ...rows]
  }, [demoDataEnabled, rows, demoVoteCounts])

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return rowsForUi
    return rowsForUi.filter((r) => {
      if (r.title.toLowerCase().includes(q)) return true
      if (r.body?.toLowerCase().includes(q)) return true
      return false
    })
  }, [rowsForUi, searchQuery])

  const byStatus = useMemo(() => {
    const map = new Map<FeatureStatus, FeatureRequestRow[]>()
    for (const s of STATUS_ORDER) map.set(s, [])

    const sorted = [...filteredRows]
    if (sortBy === 'votes') {
      sorted.sort((a, b) => b.vote_count - a.vote_count || +new Date(b.created_at) - +new Date(a.created_at))
    } else {
      sorted.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    }

    for (const r of sorted) {
      const st = r.status
      if (!map.has(st)) continue
      map.get(st)!.push(r)
    }
    return map
  }, [filteredRows, sortBy])

  async function onSubmit(values: FormValues) {
    setSubmitError(null)
    setSubmitSuccess(false)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSubmitError('Du må være innlogget.')
      return
    }

    const body = values.body?.trim() || null
    const { data, error } = await supabase
      .from('feature_request')
      .insert({
        title: values.title.trim(),
        body,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('[roadmap] insert', error)
      setSubmitError(error.message || 'Kunne ikke sende inn forslaget.')
      return
    }

    reset({ title: '', body: '' })
    setRows((prev) => [data as FeatureRequestRow, ...prev])
    setSubmitSuccess(true)
  }

  async function toggleVote(requestId: string) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    if (isDemoRoadmapId(requestId)) {
      const base = DEMO_FEATURE_REQUESTS.find((r) => r.id === requestId)
      if (!base) return
      const wasVoted = votedIds.has(requestId)
      const current = demoVoteCounts[requestId] ?? base.vote_count
      setVotedIds((s) => {
        const n = new Set(s)
        if (wasVoted) n.delete(requestId)
        else n.add(requestId)
        return n
      })
      setDemoVoteCounts((prev) => ({
        ...prev,
        [requestId]: wasVoted ? Math.max(0, current - 1) : current + 1,
      }))
      return
    }

    const wasVoted = votedIds.has(requestId)
    const prevRows = rows

    if (wasVoted) {
      setVotedIds((s) => {
        const n = new Set(s)
        n.delete(requestId)
        return n
      })
      setRows((rs) =>
        rs.map((r) => (r.id === requestId ? { ...r, vote_count: Math.max(0, r.vote_count - 1) } : r)),
      )
      const { error } = await supabase
        .from('feature_vote')
        .delete()
        .eq('request_id', requestId)
        .eq('user_id', user.id)
      if (error) {
        console.error('[roadmap] unvote', error)
        setVotedIds((s) => new Set(s).add(requestId))
        setRows(prevRows)
      }
    } else {
      setVotedIds((s) => new Set(s).add(requestId))
      setRows((rs) =>
        rs.map((r) => (r.id === requestId ? { ...r, vote_count: r.vote_count + 1 } : r)),
      )
      const { error } = await supabase.from('feature_vote').insert({
        request_id: requestId,
        user_id: user.id,
      })
      if (error) {
        console.error('[roadmap] vote', error)
        setVotedIds((s) => {
          const n = new Set(s)
          n.delete(requestId)
          return n
        })
        setRows(prevRows)
      }
    }
  }

  return (
    <div className="space-y-8">
      <div
        className="rounded-xl p-4 text-sm"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <p className="font-medium" style={{ color: 'var(--text)' }}>
          Stemmer hjelper oss å prioritere — det er ikke et løfte om at alt blir bygd. Vi leser alle forslag.
        </p>
        <p className="mt-2" style={{ color: 'var(--text-muted)' }}>
          Status på kortene oppdateres fortløpende når vi jobber med appen.
        </p>
        <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          Forslag og stemmer er synlige for alle innloggede brukere i appen — ikke send inn sensitive
          personopplysninger.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          Foreslå forbedring
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 max-w-xl">
          {submitSuccess && (
            <div
              className="rounded-xl px-3 py-2.5 text-sm"
              style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                color: 'var(--text)',
              }}
              role="status"
            >
              Takk — forslaget er sendt inn. Vi leser det sammen med de andre.
            </div>
          )}
          <div>
            <label htmlFor="roadmap-title" className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
              Tittel
            </label>
            <input
              id="roadmap-title"
              type="text"
              autoComplete="off"
              className="w-full px-3 py-2 rounded-xl text-sm shadow-[inset_0_1px_2px_rgba(30,43,79,0.04)]"
              style={{ border: '1px solid var(--border)', background: '#ffffff', color: 'var(--text)' }}
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs mt-1" style={{ color: 'var(--danger, #c92a2a)' }}>
                {errors.title.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="roadmap-body" className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
              Beskrivelse (valgfritt)
            </label>
            <textarea
              id="roadmap-body"
              rows={4}
              className="w-full px-3 py-2 rounded-xl text-sm resize-y min-h-[100px] shadow-[inset_0_1px_2px_rgba(30,43,79,0.04)]"
              style={{ border: '1px solid var(--border)', background: '#ffffff', color: 'var(--text)' }}
              placeholder="Forklar gjerne kort hva du ønsker deg …"
              {...register('body')}
            />
            {errors.body && (
              <p className="text-xs mt-1" style={{ color: 'var(--danger, #c92a2a)' }}>
                {errors.body.message}
              </p>
            )}
          </div>
          {submitError && (
            <p className="text-sm" style={{ color: 'var(--danger, #c92a2a)' }}>
              {submitError}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60 inline-flex items-center gap-2 border transition-colors hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
            style={{
              background: '#ffffff',
              borderColor: 'var(--border)',
              color: 'var(--text)',
              boxShadow: '0 1px 2px rgba(30, 43, 79, 0.06)',
            }}
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? 'Sender …' : 'Send inn forslag'}
          </button>
        </form>
      </section>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-sm font-semibold shrink-0" style={{ color: 'var(--text)' }}>
            Roadmap
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-1 min-w-0 lg:justify-end">
            <div className="relative flex-1 min-w-0 max-w-md">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Søk i tittel eller beskrivelse …"
                className="w-full pl-9 pr-3 py-2 rounded-xl text-sm shadow-[inset_0_1px_2px_rgba(30,43,79,0.04)]"
                style={{ border: '1px solid var(--border)', background: '#ffffff', color: 'var(--text)' }}
                autoComplete="off"
                aria-label="Søk i forslag"
              />
            </div>
            <label className="flex items-center gap-2 text-sm shrink-0" style={{ color: 'var(--text-muted)' }}>
              <span>Sorter</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'votes' | 'newest')}
                className="px-3 py-2 rounded-lg text-sm shadow-[inset_0_1px_2px_rgba(30,43,79,0.04)] min-w-[10rem]"
                style={{ border: '1px solid var(--border)', background: '#ffffff', color: 'var(--text)' }}
              >
                <option value="votes">Etter stemmer</option>
                <option value="newest">Nyeste først</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {loading && <RoadmapBoardSkeleton />}

      {loadError && !loading && (
        <p className="text-sm rounded-xl p-3" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
          {loadError}
        </p>
      )}

      {!loading && !loadError && (
        <div className="overflow-x-auto -mx-2 px-2 pb-2">
          <div className="flex gap-3 min-w-max md:min-w-0 md:grid md:grid-cols-5 md:gap-4 items-start">
            {STATUS_ORDER.map((status) => {
              const items = byStatus.get(status) ?? []
              return (
                <div
                  key={status}
                  className="w-[min(92vw,280px)] shrink-0 md:w-auto md:min-w-0 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                      {STATUS_LABELS[status]}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-md"
                      style={{ background: '#ffffff', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                    >
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-2 min-h-[120px]">
                    {items.length === 0 ? (
                      <p
                        className="text-xs px-1 py-6 text-center rounded-xl bg-white"
                        style={{ color: 'var(--text-muted)', border: '1px dashed var(--border)' }}
                      >
                        {searchQuery.trim() ? 'Ingen treff i denne kolonnen.' : 'Ingen her ennå.'}
                      </p>
                    ) : (
                      items.map((r) => {
                        const dateLabel = formatCardDate(r.created_at)
                        return (
                          <article
                            key={r.id}
                            className="rounded-xl p-3 text-left shadow-sm flex flex-col"
                            style={{
                              background: '#ffffff',
                              border: '1px solid var(--border)',
                              boxShadow: '0 1px 2px rgba(30, 43, 79, 0.04)',
                            }}
                          >
                            <div className="flex gap-2 min-h-0">
                              <div className="min-w-0 flex-1 flex flex-col min-h-0 max-h-[min(55vh,18rem)] overflow-y-auto pr-1">
                                <h3 className="text-sm font-semibold leading-snug" style={{ color: 'var(--text)' }}>
                                  {r.title}
                                </h3>
                                {dateLabel && (
                                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    {dateLabel}
                                  </p>
                                )}
                                {r.body && <RequestCardBody body={r.body} />}
                              </div>
                              <button
                                type="button"
                                onClick={() => void toggleVote(r.id)}
                                className="shrink-0 flex flex-col items-center justify-center w-11 py-1.5 rounded-lg text-xs font-semibold transition-colors self-start"
                                style={{
                                  background: votedIds.has(r.id) ? '#F4F6FA' : '#ffffff',
                                  border: '1px solid var(--border)',
                                  color: votedIds.has(r.id) ? 'var(--text)' : 'var(--text-muted)',
                                }}
                                aria-pressed={votedIds.has(r.id)}
                                aria-label={votedIds.has(r.id) ? 'Trekk stemme' : 'Stem'}
                              >
                                <ChevronUp size={18} strokeWidth={2.5} />
                                <span>{r.vote_count}</span>
                              </button>
                            </div>
                          </article>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
