'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { useId, useMemo, useState, useTransition } from 'react'
import {
  forumCreateThreadAction,
  type ForumActionResult,
} from '@/lib/forum/actions'
import ForumAttachmentPicker from '@/components/forum/ForumAttachmentPicker'
import { partitionForumAttachments, uploadForumPostAttachments } from '@/lib/forum/uploadAttachments'
import { createClient } from '@/lib/supabase/client'
import { useSubscriptionReadOnly } from '@/components/app/SubscriptionReadOnlyProvider'

/** Kategori som sendes til skjemaet (fra forum_category). */
export type ForumCategoryOption = {
  id: string
  slug: string
  title: string
  description: string | null
}

interface ForumNewThreadFormProps {
  categories: ForumCategoryOption[]
  /** Forslag ved åpning — brukeren kan alltid bytte før publisering. */
  defaultCategoryId?: string
  layout?: 'page' | 'modal'
  onCancel?: () => void
  /** Kalles etter vellykket opprettelse (f.eks. lukk modal) — før navigasjon til tråden. */
  onPublished?: () => void
}

export default function ForumNewThreadForm({
  categories,
  defaultCategoryId,
  layout = 'page',
  onCancel,
  onPublished,
}: ForumNewThreadFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const { hasSubscriptionAccess, appReadOnly } = useSubscriptionReadOnly()
  const canWrite = hasSubscriptionAccess && !appReadOnly

  function initialCategorySelection(): string {
    const defaultOk =
      defaultCategoryId && categories.some((c) => c.id === defaultCategoryId) ? defaultCategoryId : ''
    if (layout === 'modal') {
      return defaultOk || ''
    }
    return defaultOk || categories[0]?.id || ''
  }

  const [categoryId, setCategoryId] = useState<string>(() => initialCategorySelection())
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [threadFiles, setThreadFiles] = useState<File[]>([])
  const [feedback, setFeedback] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  const radioName = useId()
  const categorySelectId = useId()
  const threadAttachId = useId()

  const filteredCategories = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return categories
    return categories.filter((c) => {
      const t = `${c.title} ${c.slug} ${c.description ?? ''}`.toLowerCase()
      return t.includes(q)
    })
  }, [categories, filter])

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setFeedback(null)
    if (!canWrite) {
      setFeedback('Skriving krever aktiv prøveperiode eller abonnement.')
      return
    }

    startTransition(async () => {
      const fileChk = partitionForumAttachments(threadFiles)
      if (!fileChk.ok) {
        setFeedback(fileChk.error)
        return
      }

      const result: ForumActionResult & { threadId?: string; firstPostId?: string } = await forumCreateThreadAction({
        categoryId,
        title,
        body,
      })

      if (!result.ok || !result.threadId) {
        setFeedback(result.ok ? 'Kunne ikke opprette tråd.' : result.error)
        return
      }

      let partialWarn: string | null = null
      if (fileChk.files.length > 0 && result.firstPostId) {
        const sb = createClient()
        const u = await sb.auth.getUser()
        if (!u.data.user) {
          partialWarn = 'Tråden ble opprettet, men du er ikke innlogget for vedleggsopplasting.'
        } else {
          const up = await uploadForumPostAttachments(sb, u.data.user.id, result.firstPostId, fileChk.files)
          if (!up.ok) partialWarn = `Tråden ble opprettet, men vedlegg ble ikke lagret: ${up.error}`
        }
      } else if (fileChk.files.length > 0 && !result.firstPostId) {
        partialWarn = 'Tråden ble opprettet, men vi fant ikke første innlegg for vedleggsopplasting.'
      }

      if (partialWarn) window.alert(partialWarn)

      setTitle('')
      setBody('')
      setFilter('')
      setThreadFiles([])
      onPublished?.()
      router.push(`/intern/forum-beta/trad/${result.threadId}`)
      router.refresh()
    })
  }

  const disabledSubmit = pending || !categoryId.trim() || !title.trim() || !body.trim()

  const fieldSurface = 'var(--surface)'
  const fieldBg = 'var(--bg)'

  return (
    <div className={[layout === 'modal' ? 'w-full max-w-xl min-w-0' : 'max-w-xl', 'space-y-3 min-w-0'].join(' ')}>
      {!canWrite && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Skrivebeskyttet: du kan ikke opprette tråd uten aktiv prøveperiode eller abonnement. Besøk{' '}
          <Link href="/konto/betalinger" className="underline font-medium" style={{ color: 'var(--primary)' }}>
            Betalinger
          </Link>
          .
        </p>
      )}

      {feedback && (
        <p
          className="text-sm rounded-xl px-3 py-2 border min-w-0"
          role="alert"
          style={{
            color: '#b91c1c',
            borderColor: 'color-mix(in srgb, #fecaca 80%, var(--border))',
            background: 'color-mix(in srgb, #fef2f2 92%, var(--surface))',
          }}
        >
          {feedback}
        </p>
      )}

      <form onSubmit={onSubmit} className="space-y-4 touch-manipulation">
        {categories.length > 0 ? (
          layout === 'modal' ? (
            <div className="min-w-0">
              <label htmlFor={categorySelectId} className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
                Emnflate
              </label>
              <select
                id={categorySelectId}
                value={categoryId}
                onChange={(ev) => setCategoryId(ev.target.value)}
                disabled={pending || !canWrite}
                aria-required
                className="w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-sm shadow-[inset_0_1px_2px_rgba(30,43,79,0.04)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                style={{
                  borderColor: 'var(--border)',
                  background: fieldBg,
                  color: 'var(--text)',
                }}
              >
                <option value="" disabled>
                  Velg emnflate …
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <p className="text-xs leading-relaxed pt-1.5 min-w-0" style={{ color: 'var(--text-muted)' }}>
                Ingen passer? Velg <strong style={{ color: 'var(--text)' }}>Generelt</strong> og presiser i tittelen.
              </p>
            </div>
          ) : (
            <fieldset className="min-w-0 space-y-2 border-0 p-0">
              <legend className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
                Velg emneflate (fra standardlisten)
              </legend>
              <input
                type="search"
                autoComplete="off"
                aria-label="Filtrer blant emneflater"
                value={filter}
                disabled={pending}
                onChange={(ev) => setFilter(ev.target.value)}
                placeholder="Skriv stikkord fra forslagene …"
                className="mb-3 w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-sm shadow-[inset_0_1px_2px_rgba(30,43,79,0.04)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                style={{ borderColor: 'var(--border)', background: fieldBg, color: 'var(--text)' }}
              />
              <div
                className="-mx-0.5 max-h-[min(14rem,calc(100dvh-18rem))] space-y-2 overflow-y-auto overscroll-contain px-0.5"
                role="radiogroup"
                aria-required
              >
                {filteredCategories.length === 0 ? (
                  <p className="text-xs py-3" style={{ color: 'var(--text-muted)' }}>
                    Ingen treff på filteret — tøm søkefeltet eller velg direkte nedenfor.
                  </p>
                ) : null}
                {filteredCategories.map((c) => {
                  const checked = categoryId === c.id
                  return (
                    <label
                      key={c.id}
                      className={[
                        'flex min-w-0 cursor-pointer gap-3 rounded-xl border p-3 transition-colors touch-manipulation',
                        checked
                          ? 'ring-2 ring-[color-mix(in_srgb,var(--primary)_45%,var(--border))]'
                          : 'hover:bg-[color-mix(in_srgb,var(--primary-pale)_45%,var(--surface))]',
                      ].join(' ')}
                      style={{
                        borderColor: 'var(--border)',
                        background: checked ? 'color-mix(in srgb, var(--primary-pale) 35%, var(--surface))' : fieldSurface,
                      }}
                    >
                      <input
                        type="radio"
                        name={radioName}
                        value={c.id}
                        checked={checked}
                        disabled={pending}
                        onChange={() => setCategoryId(c.id)}
                        className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
                          {c.title}
                        </span>
                        {c.description?.trim() ? (
                          <span className="mt-0.5 block text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>
                            {c.description}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  )
                })}
              </div>
              <p className="text-xs leading-relaxed pt-1" style={{ color: 'var(--text-muted)' }}>
                Dette er de faste emneflatene i forumet. Finner du ingen som passer, velg{' '}
                <strong style={{ color: 'var(--text)' }}>Generelt</strong> og skriv det presise temaet i tittelen (du kan
                ikke opprette nye faste kategorier selv).
              </p>
            </fieldset>
          )
        ) : (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Ingen kategori er tilgjengelig. Oppdater siden eller kontakt drift.
          </p>
        )}

        <div>
          <label htmlFor="forum-title" className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
            Tittel
          </label>
          <input
            id="forum-title"
            type="text"
            disabled={pending || !canWrite}
            autoComplete="off"
            maxLength={240}
            value={title}
            onChange={(ev) => setTitle(ev.target.value)}
            className="w-full min-h-[44px] px-3 py-2.5 rounded-xl text-sm shadow-[inset_0_1px_2px_rgba(30,43,79,0.04)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            style={{ border: '1px solid var(--border)', background: fieldBg, color: 'var(--text)' }}
            placeholder="F.eks. Tips til matbudsjett for familier"
          />
        </div>

        <div>
          <label htmlFor="forum-body-first" className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
            Innhold
          </label>
          <textarea
            id="forum-body-first"
            disabled={pending || !canWrite}
            rows={layout === 'modal' ? 5 : 6}
            value={body}
            onChange={(ev) => setBody(ev.target.value)}
            className="w-full min-h-[120px] px-3 py-2.5 rounded-xl text-sm resize-y min-w-0 max-w-full shadow-[inset_0_1px_2px_rgba(30,43,79,0.04)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            style={{ border: '1px solid var(--border)', background: fieldBg, color: 'var(--text)' }}
            placeholder="Skriv første innlegg i tråden…"
          />
        </div>

        <div>
          <span className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>
            Vedlegg (valgfritt)
          </span>
          <ForumAttachmentPicker
            id={threadAttachId}
            disabled={pending || !canWrite}
            files={threadFiles}
            onChangeFiles={setThreadFiles}
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {layout === 'modal' && onCancel ? (
            <button
              type="button"
              disabled={pending}
              onPointerDown={() => onCancel()}
              className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl text-sm font-medium border touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              style={{ borderColor: 'var(--border)', background: fieldSurface, color: 'var(--text)' }}
            >
              Avbryt
            </button>
          ) : null}
          <button
            type="submit"
            disabled={disabledSubmit || !canWrite}
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-50 disabled:pointer-events-none outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--cta-end, #4361EE))' }}
          >
            {pending ? 'Oppretter…' : 'Publiser tråd'}
          </button>
        </div>
      </form>
    </div>
  )
}
