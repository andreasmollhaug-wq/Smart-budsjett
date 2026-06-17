'use client'

import { useState } from 'react'
import { Bookmark, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEnkelHandlelisteStore } from './enkelHandlelisteStore'
import { useEnkelHandlelisteCanMutate } from './useEnkelHandlelisteContext'
import { HouseholdReadonlyBanner } from './HouseholdReadonlyBanner'
import { EnkelHandlelisteTemplateEditor } from './EnkelHandlelisteTemplateEditor'
import { EnkelHandlelisteListPickerSheet } from './components/EnkelHandlelisteListPickerSheet'
import { EnkelHandlelisteConfirmDialog } from './components/EnkelHandlelisteConfirmDialog'
import { EnkelHandlelisteNameSheet } from './components/EnkelHandlelisteNameSheet'
import { ehIconBtnClass, ehIconBtnStyle } from './ehUi'

const WEEKDAYS = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag']

export function EnkelHandlelisteTemplatesPage() {
  const templates = useEnkelHandlelisteStore((s) => s.templates)
  const lists = useEnkelHandlelisteStore((s) => s.lists)
  const ehDeleteTemplate = useEnkelHandlelisteStore((s) => s.ehDeleteTemplate)
  const ehApplyTemplate = useEnkelHandlelisteStore((s) => s.ehApplyTemplate)
  const { canMutate, activeProfileId } = useEnkelHandlelisteCanMutate()

  const [editorId, setEditorId] = useState<string | 'new' | null>(null)
  const [applyTemplateId, setApplyTemplateId] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const activeLists = lists.filter((l) => !l.archivedAt)

  return (
    <div className="min-w-0">
      <header className="mb-5 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Maler
          </h1>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>
            Faste lister du raskt kan fylle inn — f.eks. ukeshandel.
          </p>
        </div>
        {canMutate && (
          <button type="button" className={ehIconBtnClass} style={ehIconBtnStyle} aria-label="Ny mal" onClick={() => setNewOpen(true)}>
            <Plus size={20} aria-hidden />
          </button>
        )}
      </header>

      {!canMutate && <HouseholdReadonlyBanner />}

      {templates.length === 0 ? (
        <div className="mt-12 flex flex-col items-center px-6 text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl" style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}>
            <Bookmark size={26} aria-hidden />
          </span>
          <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>
            Ingen maler ennå
          </p>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Lag en mal fra en handleliste, eller trykk + for å starte en ny.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {templates.map((t) => (
            <li
              key={t.id}
              className="rounded-2xl border p-4"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)', boxShadow: '0 1px 2px rgba(30,43,79,0.04), 0 4px 14px rgba(30,43,79,0.06)' }}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}>
                  <Bookmark size={18} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
                    {t.name}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <span>{t.lines.length} varer</span>
                    {t.suggestedWeekday != null && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}>
                        {WEEKDAYS[t.suggestedWeekday]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {canMutate && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-4 text-sm font-semibold text-white touch-manipulation active:scale-95"
                    style={{ background: 'var(--cta-gradient)' }}
                    onClick={() => setApplyTemplateId(t.id)}
                  >
                    Bruk
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border px-4 text-sm font-medium touch-manipulation active:scale-95"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    onClick={() => setEditorId(t.id)}
                  >
                    <Pencil size={15} aria-hidden />
                    Rediger
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border px-4 text-sm font-medium touch-manipulation active:scale-95"
                    style={{ borderColor: 'var(--border)', color: 'var(--danger)' }}
                    onClick={() => setDeleteId(t.id)}
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <EnkelHandlelisteNameSheet
        open={newOpen}
        title="Ny mal"
        label="Navn"
        defaultValue="Fast ukeshandel"
        onClose={() => setNewOpen(false)}
        onSubmit={(name) => {
          setNewTemplateName(name)
          setEditorId('new')
        }}
      />

      {(editorId === 'new' || (editorId && templates.some((t) => t.id === editorId))) && (
        <EnkelHandlelisteTemplateEditor
          templateId={editorId === 'new' ? null : editorId}
          initialName={editorId === 'new' ? newTemplateName : undefined}
          onClose={() => {
            setEditorId(null)
            setNewTemplateName('')
          }}
        />
      )}

      <EnkelHandlelisteListPickerSheet
        open={!!applyTemplateId}
        title="Velg handleliste"
        lists={activeLists}
        onClose={() => setApplyTemplateId(null)}
        onPick={(listId) => {
          if (applyTemplateId) ehApplyTemplate(applyTemplateId, listId, 'merge', activeProfileId)
          setApplyTemplateId(null)
        }}
      />

      <EnkelHandlelisteConfirmDialog
        open={!!deleteId}
        title="Slett mal"
        message="Slette denne malen?"
        danger
        confirmLabel="Slett"
        onConfirm={() => {
          if (deleteId) ehDeleteTemplate(deleteId, activeProfileId)
          setDeleteId(null)
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
