'use client'

import { useEffect, useRef, useState } from 'react'
import { splitShoppingInput } from '@/features/enkelHandleliste/parseCommaInput'
import { EhSheet } from '@/features/enkelHandleliste/components/EhSheet'
import {
  ehPrimaryBtnClass,
  ehPrimaryBtnStyle,
  ehSecondaryBtnClass,
  ehSecondaryBtnStyle,
} from '@/features/enkelHandleliste/ehUi'

export function EnkelHandlelisteAddItemsModal({
  open,
  onClose,
  onSubmit,
  title = 'Legg til varer',
  hint = 'Flere varer? Skill med komma eller linjeskift — f.eks. brød, melk, ost',
}: {
  open: boolean
  onClose: () => void
  onSubmit: (names: string[]) => void
  title?: string
  hint?: string
}) {
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => ref.current?.focus(), 80)
      return () => clearTimeout(t)
    }
  }, [open])

  const count = splitShoppingInput(text).length

  const handleSubmit = () => {
    const names = splitShoppingInput(text)
    if (!names.length) return
    onSubmit(names)
    setText('')
    onClose()
  }

  return (
    <EhSheet
      open={open}
      onClose={onClose}
      title={title}
      description={hint}
      footer={
        <div className="flex gap-2.5">
          <button type="button" className={`flex-1 ${ehSecondaryBtnClass}`} style={ehSecondaryBtnStyle} onClick={onClose}>
            Avbryt
          </button>
          <button
            type="button"
            className={`flex-1 ${ehPrimaryBtnClass}`}
            style={ehPrimaryBtnStyle}
            disabled={count === 0}
            onClick={handleSubmit}
          >
            {count > 0 ? `Legg til ${count}` : 'Legg til'}
          </button>
        </div>
      }
    >
      <textarea
        ref={ref}
        className="min-h-[120px] w-full rounded-2xl border px-4 py-3 text-base outline-none"
        style={{ borderColor: 'var(--border)', color: 'var(--text)', background: 'var(--bg)' }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Skriv eller lim inn fra SMS…"
      />
    </EhSheet>
  )
}
