'use client'

import { MatHandlelisteShoppingListPrint, type MatHandlelisteShoppingListPrintVariant } from '@/components/matHandleliste/MatHandlelisteShoppingListPrint'
import {
  mergeShoppingListPdfLayout,
  type ShoppingListPdfLayoutOptions,
  type ShoppingListPdfTemplate,
} from '@/features/matHandleliste/printPdfLayout'
import type { ShoppingListItem } from '@/features/matHandleliste/types'
import { useModalBackdropDismiss } from '@/hooks/useModalBackdropDismiss'
import { BookmarkPlus, Loader2, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useId, useState } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  list: ShoppingListItem[]
  categoryOrder: string[]
  title: string
  subtitle?: string
  intro?: string
  variant: MatHandlelisteShoppingListPrintVariant
  layout: ShoppingListPdfLayoutOptions
  onLayoutChange: (next: ShoppingListPdfLayoutOptions) => void
  templates: ShoppingListPdfTemplate[]
  lastTemplateId: string | null
  onSelectTemplate: (templateId: string) => void
  onSaveTemplate: (name: string) => void
  onRemoveTemplate: (templateId: string) => void
  onSetLastTemplateId: (id: string | null) => void
  onDownload: () => Promise<void>
  downloading: boolean
}

function LayoutCheckbox({
  id,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  id: string
  label: string
  description?: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 touch-manipulation ${disabled ? 'opacity-50' : ''}`}
      style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-1 h-5 w-5 min-h-[44px] min-w-[44px] shrink-0 cursor-pointer accent-[var(--primary)] sm:mt-1 sm:min-h-0 sm:min-w-0 sm:h-5 sm:w-5"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="min-w-0 flex-1">
        <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs" style={{ color: 'var(--text-muted)' }}>
            {description}
          </span>
        ) : null}
      </span>
    </label>
  )
}

export function MatHandlelisteExportPdfModal({
  open,
  onClose,
  list,
  categoryOrder,
  title,
  subtitle,
  intro,
  variant,
  layout,
  onLayoutChange,
  templates,
  lastTemplateId,
  onSelectTemplate,
  onSaveTemplate,
  onRemoveTemplate,
  onSetLastTemplateId,
  onDownload,
  downloading,
}: Props) {
  const titleId = useId()
  const backdrop = useModalBackdropDismiss(onClose)
  const [saveName, setSaveName] = useState('')

  const patch = useCallback(
    (partial: Partial<ShoppingListPdfLayoutOptions>) => {
      onLayoutChange(mergeShoppingListPdfLayout({ ...layout, ...partial }))
    },
    [layout, onLayoutChange],
  )

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const handleSaveTemplate = () => {
    const n = saveName.trim()
    if (!n) return
    onSaveTemplate(n)
    setSaveName('')
  }

  if (!open) return null

  const previewLayout = mergeShoppingListPdfLayout(layout)

  return (
    <div
      className="fixed inset-0 z-[100] flex max-h-[100dvh] items-end justify-center sm:items-center sm:p-4"
      style={{
        background: 'rgba(0,0,0,0.45)',
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(0.5rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.5rem, env(safe-area-inset-right))',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      {...backdrop}
    >
      <div
        className="flex max-h-[min(92dvh,920px)] w-full max-w-2xl min-w-0 flex-col overflow-hidden rounded-t-2xl border shadow-xl sm:rounded-2xl"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2 id={titleId} className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Eksporter PDF
          </h2>
          <button
            type="button"
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border touch-manipulation"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            onClick={onClose}
            aria-label="Lukk"
          >
            <X size={22} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-3">
          <p className="mb-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            Velg hva som skal være med i utskriften. Forhåndsvisningen nedenfor er veiledende.
          </p>

          <div className="space-y-2">
            <LayoutCheckbox
              id={`${titleId}-brand`}
              label="Smart Budsjett-merke"
              checked={layout.showBrand}
              onChange={(c) => patch({ showBrand: c })}
            />
            <LayoutCheckbox
              id={`${titleId}-disc`}
              label="Ansvarsfraskrivelse / hjelpetekst"
              checked={layout.showDisclaimer}
              onChange={(c) => patch({ showDisclaimer: c })}
            />
            <LayoutCheckbox
              id={`${titleId}-date`}
              label="Dato på ark"
              checked={layout.showPrintDate}
              onChange={(c) => patch({ showPrintDate: c })}
            />
            <LayoutCheckbox
              id={`${titleId}-price`}
              label="Priskolonner (katalog og delsum)"
              checked={layout.showPriceColumns}
              onChange={(c) => patch({ showPriceColumns: c, ...(c ? {} : { showEstimatedSumFooter: false }) })}
            />
            <LayoutCheckbox
              id={`${titleId}-sum`}
              label="Sum estimat i bunntekst"
              description="Krever priskolonner."
              checked={layout.showEstimatedSumFooter}
              disabled={!layout.showPriceColumns}
              onChange={(c) => patch({ showEstimatedSumFooter: c })}
            />
            <LayoutCheckbox
              id={`${titleId}-box`}
              label="Kolonne med avkrysning («Huket») for penn i butikk"
              checked={layout.showCheckboxColumn}
              onChange={(c) => patch({ showCheckboxColumn: c })}
            />
            <LayoutCheckbox
              id={`${titleId}-lines`}
              label="Antall gjenstående linjer i bunntekst"
              checked={layout.showLineCountFooter}
              onChange={(c) => patch({ showLineCountFooter: c })}
            />
          </div>

          <div className="mt-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Maler
            </p>
            {templates.length > 0 ? (
              <label className="block text-sm font-medium" style={{ color: 'var(--text)' }}>
                Bruk lagret mal
                <select
                  className="mt-1 flex min-h-[44px] w-full rounded-xl border px-3 py-2 text-sm touch-manipulation"
                  style={{
                    borderColor: 'var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                  value={lastTemplateId ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    if (!v) {
                      onSetLastTemplateId(null)
                      return
                    }
                    onSelectTemplate(v)
                  }}
                >
                  <option value="">— ingen valgt —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Ingen maler ennå — lag én med navn og knappen under.
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value.slice(0, 48))}
                placeholder="Navn på ny mal"
                className="min-h-[44px] min-w-0 flex-1 rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
              <button
                type="button"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium touch-manipulation"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                onClick={handleSaveTemplate}
              >
                <BookmarkPlus size={18} aria-hidden /> Lagre som mal
              </button>
            </div>

            {templates.length > 0 ? (
              <ul className="space-y-1.5 border-t pt-3 text-sm" style={{ borderColor: 'var(--border)' }}>
                {templates.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-medium" style={{ color: 'var(--text)' }}>
                      {t.name}
                    </span>
                    <button
                      type="button"
                      className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg touch-manipulation"
                      style={{ color: '#E03131' }}
                      aria-label={`Slett mal ${t.name}`}
                      onClick={() => onRemoveTemplate(t.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="mt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Forhåndsvisning
            </p>
            <div
              className="relative max-h-[min(220px,40vh)] w-full overflow-auto rounded-xl border md:max-h-[320px]"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg)',
              }}
            >
              <div
                className="pointer-events-none origin-top-left md:origin-top-right"
                style={{
                  transform: 'scale(0.38)',
                  transformOrigin: 'top left',
                  width: `${100 / 0.38}%`,
                  minHeight: 120,
                  marginBottom: `calc(${-100 * (1 - 0.38)}% )`,
                }}
              >
                <MatHandlelisteShoppingListPrint
                  list={list}
                  categoryOrder={categoryOrder}
                  title={title}
                  subtitle={subtitle}
                  intro={intro}
                  variant={variant}
                  layout={previewLayout}
                  suppressPdfCaptureRootId
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex shrink-0 flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:justify-end"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            type="button"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border px-4 text-sm font-medium touch-manipulation sm:w-auto sm:min-w-[7rem]"
            style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            onClick={onClose}
          >
            Avbryt
          </button>
          <button
            type="button"
            disabled={downloading}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white touch-manipulation disabled:opacity-50 sm:w-auto sm:min-w-[12rem]"
            style={{ background: 'var(--primary)' }}
            onClick={() => void onDownload()}
          >
            {downloading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
            Last ned PDF
          </button>
        </div>
      </div>
    </div>
  )
}
