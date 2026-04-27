'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ChevronUp, Loader2, Search, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useStore } from '@/lib/store'
import { DEMO_FEATURE_REQUESTS, isDemoRoadmapId } from '@/lib/demoRoadmap'
import { RoadmapRequestAttachmentImage } from '@/components/roadmap/RoadmapRequestAttachmentImage'
import {
  buildFeatureRequestImagePath,
  FEATURE_REQUEST_IMAGES_BUCKET,
  sanitizeImageFileName,
  validateRoadmapImageFile,
  ROADMAP_IMAGE_ACCEPT,
} from '@/lib/roadmap/attachmentPath'

const STATUS_ORDER = ['pending', 'approved', 'in_progress', 'done', 'rejected'] as const
type FeatureStatus = (typeof STATUS_ORDER)[number]

const STATUS_LABELS: Record<FeatureStatus, string> = {
  pending: 'Venter',
  approved: 'Godkjent',
  in_progress: 'Under arbeid',
  done: 'Ferdig',
  rejected: 'Avvist',
}

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
  /** Sti i bucket feature_request_images; null når ingen bilde. */
  image_path: string | null
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
    <div className="overflow-x-auto overflow-y-visible -mx-4 sm:-mx-5 px-4 sm:px-5 pb-2" aria-hidden>
      <div className="flex gap-3 min-w-max items-start">
        {STATUS_ORDER.map((status) => (
          <div
            key={status}
            className="w-[min(85vw,260px)] sm:w-[260px] shrink-0 flex flex-col gap-2"
          >
            <div className="h-4 w-24 rounded animate-pulse" style={{ background: 'var(--border)' }} />
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={`${status}-${i}`}
                  className="rounded-xl p-3 h-[88px] animate-pulse"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
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

function RequestCardBodyPreview({ body }: { body: string }) {
  return (
    <p className="text-xs mt-1 whitespace-pre-wrap line-clamp-4" style={{ color: 'var(--text-muted)' }}>
      {body}
    </p>
  )
}

function RoadmapRequestDetailModal({
  request,
  imagePublicUrl,
  onClose,
  votedIds,
  onToggleVote,
}: {
  request: FeatureRequestRow | null
  imagePublicUrl: string | null
  onClose: () => void
  votedIds: Set<string>
  onToggleVote: (id: string) => void
}) {
  useEffect(() => {
    if (!request) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [request, onClose])

  if (!request) return null

  const dateLabel = formatCardDate(request.created_at)
  const statusLabel = STATUS_LABELS[request.status]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="roadmap-detail-title"
    >
      <button type="button" className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" aria-label="Lukk" onClick={onClose} />
      <div
        className="relative flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col rounded-2xl shadow-2xl md:max-w-xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px -12px rgba(30, 43, 79, 0.12)',
        }}
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 shrink-0 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 gap-y-1 mb-2">
              <span
                className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md"
                style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              >
                {statusLabel}
              </span>
              {dateLabel && (
                <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {dateLabel}
                </span>
              )}
            </div>
            <h2 id="roadmap-detail-title" className="text-[17px] font-semibold tracking-tight leading-snug" style={{ color: 'var(--text)' }}>
              {request.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 outline-none transition-colors hover:opacity-70 focus-visible:ring-2 focus-visible:ring-[var(--primary)] shrink-0"
            style={{ background: 'var(--bg)' }}
            aria-label="Lukk"
          >
            <X size={18} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {request.body?.trim() ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {request.body}
            </p>
          ) : (
            <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>
              {imagePublicUrl ? 'Ingen tekst — kun bilde er lagt ved.' : 'Ingen beskrivelse lagt ved.'}
            </p>
          )}
          {imagePublicUrl && (
            <RoadmapRequestAttachmentImage
              publicUrl={imagePublicUrl}
              layout="modal"
              alt="Skjermbilde eller bilde knyttet til forslaget"
            />
          )}
        </div>

        <div
          className="flex items-center justify-end gap-3 px-6 py-4 shrink-0 border-t rounded-b-2xl"
          style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
        >
          <button
            type="button"
            onClick={() => void onToggleVote(request.id)}
            className="shrink-0 flex flex-col items-center justify-center min-w-[3.25rem] py-2 px-2 rounded-xl text-xs font-semibold transition-colors"
            style={{
              background: votedIds.has(request.id) ? '#F4F6FA' : '#ffffff',
              border: '1px solid var(--border)',
              color: votedIds.has(request.id) ? 'var(--text)' : 'var(--text-muted)',
            }}
            aria-pressed={votedIds.has(request.id)}
            aria-label={votedIds.has(request.id) ? 'Trekk stemme' : 'Stem'}
          >
            <ChevronUp size={18} strokeWidth={2.5} />
            <span>{request.vote_count}</span>
          </button>
        </div>
      </div>
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
  const [detailRequestId, setDetailRequestId] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [submitImageWarning, setSubmitImageWarning] = useState<string | null>(null)

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

  useEffect(() => {
    if (!pendingFile) {
      setAttachmentPreviewUrl(null)
      return
    }
    const u = URL.createObjectURL(pendingFile)
    setAttachmentPreviewUrl(u)
    return () => {
      URL.revokeObjectURL(u)
    }
  }, [pendingFile])

  const supabaseForUrls = useMemo(() => createClient(), [])

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

    const list: FeatureRequestRow[] = (reqRes.data ?? []).map((row) => {
      const r = row as { image_path?: string | null } & FeatureRequestRow
      return { ...r, image_path: r.image_path ?? null }
    })
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

  const detailRequest = useMemo(
    () => (detailRequestId ? rowsForUi.find((r) => r.id === detailRequestId) ?? null : null),
    [detailRequestId, rowsForUi],
  )

  const detailImagePublicUrl = useMemo(() => {
    const r = detailRequest
    if (!r?.image_path || isDemoRoadmapId(r.id)) return null
    return supabaseForUrls.storage.from(FEATURE_REQUEST_IMAGES_BUCKET).getPublicUrl(r.image_path).data.publicUrl
  }, [detailRequest, supabaseForUrls])

  useEffect(() => {
    if (detailRequestId && !detailRequest) setDetailRequestId(null)
  }, [detailRequestId, detailRequest])

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

  function resetWithAttachment() {
    reset({ title: '', body: '' })
    setPendingFile(null)
    setFileInputKey((k) => k + 1)
  }

  async function onSubmit(values: FormValues) {
    setSubmitError(null)
    setSubmitImageWarning(null)
    setSubmitSuccess(false)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSubmitError('Du må være innlogget.')
      return
    }

    if (pendingFile) {
      const check = validateRoadmapImageFile(pendingFile)
      if (!check.ok) {
        setSubmitError(check.message)
        return
      }
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

    const baseRow: FeatureRequestRow = {
      ...(data as FeatureRequestRow),
      image_path: (data as { image_path?: string | null }).image_path ?? null,
    }
    let nextRow: FeatureRequestRow = baseRow

    if (pendingFile) {
      const safe = sanitizeImageFileName(pendingFile.name)
      let objectPath: string
      try {
        objectPath = buildFeatureRequestImagePath(user.id, data.id, safe)
      } catch (e) {
        console.error('[roadmap] path', e)
        setSubmitImageWarning('Forslaget er sendt inn, men vi kunne ikke forberede filnavnet for bildet.')
        nextRow = baseRow
        resetWithAttachment()
        setRows((prev) => [nextRow, ...prev])
        setSubmitSuccess(true)
        return
      }

      const { error: upErr } = await supabase.storage
        .from(FEATURE_REQUEST_IMAGES_BUCKET)
        .upload(objectPath, pendingFile, { contentType: pendingFile.type, upsert: false })
      if (upErr) {
        console.error('[roadmap] storage upload', upErr)
        setSubmitImageWarning(
          'Forslaget er sendt inn, men bildet kunne ikke lastes opp. Prøv et mindre bilde (maks 2 MB) eller et annet format (PNG, JPEG, WebP, GIF).',
        )
      } else {
        const { error: rpcErr } = await supabase.rpc('set_feature_request_image', {
          p_request_id: data.id,
          p_path: objectPath,
        })
        if (rpcErr) {
          console.error('[roadmap] set_feature_request_image', rpcErr)
          setSubmitImageWarning(
            'Forslaget er sendt inn, men vi kunne ikke knytte bildet til forslaget. Ta kontakt om det vedvarer.',
          )
        } else {
          nextRow = { ...baseRow, image_path: objectPath }
        }
      }
    }

    resetWithAttachment()
    setRows((prev) => [nextRow, ...prev])
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
        <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          Skjermbilder kan vise mer enn du tror — beskjær eller slett sensitivt innhold før du laster opp.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          Foreslå forbedring
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 max-w-xl">
          {submitSuccess && (
            <div
              className="rounded-xl px-3 py-2.5 text-sm space-y-2"
              style={{
                background: '#f0fdf4',
                border: '1px solid #86efac',
                color: 'var(--text)',
              }}
              role="status"
            >
              <p>Takk — forslaget er sendt inn. Vi leser det sammen med de andre.</p>
              {submitImageWarning && (
                <p
                  className="rounded-lg px-2.5 py-2 text-sm"
                  style={{
                    background: '#fffbeb',
                    border: '1px solid #fcd34d',
                    color: 'var(--text)',
                  }}
                >
                  {submitImageWarning}
                </p>
              )}
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
          <div>
            <label
              htmlFor={`roadmap-attachment-${fileInputKey}`}
              className="text-xs font-medium mb-1 block"
              style={{ color: 'var(--text-muted)' }}
            >
              Vedlegg skjermbilde (valgfritt)
            </label>
            <input
              key={fileInputKey}
              id={`roadmap-attachment-${fileInputKey}`}
              type="file"
              accept={ROADMAP_IMAGE_ACCEPT}
              className="w-full min-h-[44px] text-sm file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border file:text-sm file:font-medium"
              style={{ color: 'var(--text)' }}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                if (!f) {
                  setPendingFile(null)
                  return
                }
                const check = validateRoadmapImageFile(f)
                if (!check.ok) {
                  setSubmitError(check.message)
                  setPendingFile(null)
                  setFileInputKey((k) => k + 1)
                  return
                }
                setSubmitError(null)
                setPendingFile(f)
              }}
            />
            <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              PNG, JPEG, WebP eller GIF — maks 2 MB.
            </p>
            {attachmentPreviewUrl && (
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
                <div
                  className="rounded-lg overflow-hidden border max-w-[200px] shrink-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- blob-URL for forhåndsvisning */}
                  <img
                    src={attachmentPreviewUrl}
                    alt="Forhåndsvisning av valgt bilde"
                    className="w-full max-h-32 object-contain"
                  />
                </div>
                <button
                  type="button"
                  className="min-h-[44px] px-3 py-2 rounded-xl text-sm border self-start"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                  onClick={() => {
                    setPendingFile(null)
                    setFileInputKey((k) => k + 1)
                  }}
                >
                  Fjern bilde
                </button>
              </div>
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

      <section
        className="rounded-xl p-4 sm:p-5 space-y-4 min-w-0"
        style={{
          background: '#ffffff',
          border: '1px solid var(--border)',
          boxShadow: '0 1px 3px rgba(30, 43, 79, 0.06)',
        }}
      >
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
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
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
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              >
                <option value="votes">Etter stemmer</option>
                <option value="newest">Nyeste først</option>
              </select>
            </label>
          </div>
        </div>

        {loading && <RoadmapBoardSkeleton />}

        {loadError && !loading && (
          <p className="text-sm rounded-xl p-3" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>
            {loadError}
          </p>
        )}

        {!loading && !loadError && (
        <div className="overflow-x-auto overflow-y-visible -mx-4 sm:-mx-5 px-4 sm:px-5 pb-2">
          <div className="flex gap-3 min-w-max items-start">
            {STATUS_ORDER.map((status) => {
              const items = byStatus.get(status) ?? []
              return (
                <div
                  key={status}
                  className="w-[min(85vw,260px)] sm:w-[260px] shrink-0 flex flex-col gap-2"
                >
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                      {STATUS_LABELS[status]}
                    </span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-md"
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                    >
                      {items.length}
                    </span>
                  </div>
                  <div className="space-y-2 min-h-[120px]">
                    {items.length === 0 ? (
                      <p
                        className="text-xs px-1 py-6 text-center rounded-xl"
                        style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px dashed var(--border)' }}
                      >
                        {searchQuery.trim() ? 'Ingen treff i denne kolonnen.' : 'Ingen her ennå.'}
                      </p>
                    ) : (
                      items.map((r) => {
                        const dateLabel = formatCardDate(r.created_at)
                        const cardImageUrl =
                          r.image_path && !isDemoRoadmapId(r.id)
                            ? supabaseForUrls.storage
                                .from(FEATURE_REQUEST_IMAGES_BUCKET)
                                .getPublicUrl(r.image_path).data.publicUrl
                            : null
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
                              <button
                                type="button"
                                onClick={() => setDetailRequestId(r.id)}
                                className="min-w-0 flex-1 flex flex-col min-h-0 text-left rounded-lg px-1 py-0.5 -mx-1 -my-0.5 hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-1 transition-colors"
                                aria-label={`Åpne detaljer: ${r.title}`}
                              >
                                <h3 className="text-sm font-semibold leading-snug" style={{ color: 'var(--text)' }}>
                                  {r.title}
                                </h3>
                                {dateLabel && (
                                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    {dateLabel}
                                  </p>
                                )}
                                {cardImageUrl && (
                                  <RoadmapRequestAttachmentImage
                                    publicUrl={cardImageUrl}
                                    layout="card"
                                    alt="Vedlegg til forslaget"
                                  />
                                )}
                                {r.body && <RequestCardBodyPreview body={r.body} />}
                                <span className="text-[11px] mt-1.5 font-medium" style={{ color: 'var(--primary)' }}>
                                  Trykk for detaljer
                                </span>
                              </button>
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
      </section>

      <RoadmapRequestDetailModal
        request={detailRequest}
        imagePublicUrl={detailImagePublicUrl}
        onClose={() => setDetailRequestId(null)}
        votedIds={votedIds}
        onToggleVote={toggleVote}
      />
    </div>
  )
}
