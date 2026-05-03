'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChildEmojiPicker } from '@/features/hjemflyt/ChildEmojiPicker'
import { deleteSmartvaneDataForProfile } from '@/features/smartvane/actions'
import { DEFAULT_PROFILE_ID, useStore } from '@/lib/store'
import type { HjemflytProfileMeta } from '@/features/hjemflyt/types'

export default function KontoProfilerPage() {
  const router = useRouter()
  const subscriptionPlan = useStore((s) => s.subscriptionPlan)
  const profiles = useStore((s) => s.profiles)
  const renameProfile = useStore((s) => s.renameProfile)
  const removeProfile = useStore((s) => s.removeProfile)
  const activeProfileId = useStore((s) => s.activeProfileId)
  const setProfileHjemflytMeta = useStore((s) => s.setProfileHjemflytMeta)

  useEffect(() => {
    if (subscriptionPlan !== 'family') {
      router.replace('/konto/innstillinger')
    }
  }, [subscriptionPlan, router])

  if (subscriptionPlan !== 'family') {
    return null
  }

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl p-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Users size={16} style={{ color: 'var(--primary)' }} />
          Profiler i husholdningen
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Du har én innlogget konto med flere budsjettprofiler (f.eks. deg og partner). Her kan du rette navn eller fjerne
          en ekstra profil som ble lagt inn ved en feil. Å fjerne en profil sletter all økonomidata som hører til den
          personen — transaksjoner, budsjett, sparemål, gjeld, investeringer og abonnementsliste for profilen.
        </p>

        <ul className="space-y-4">
          {profiles.map((p) => (
            <ProfileRow
              key={p.id}
              id={p.id}
              name={p.name}
              isPrimary={p.id === DEFAULT_PROFILE_ID}
              hjemflyt={p.hjemflyt}
              isHjemflytAdmin={activeProfileId === DEFAULT_PROFILE_ID}
              setProfileHjemflytMeta={setProfileHjemflytMeta}
              renameProfile={renameProfile}
              removeProfile={removeProfile}
            />
          ))}
        </ul>

        {profiles.length < 2 && (
          <p className="text-xs mt-4 rounded-lg px-3 py-2" style={{ background: 'var(--primary-pale)', color: 'var(--text-muted)' }}>
            For å legge til flere profiler, bruk «Legg til» ved «Viser data for» i menyen. Krever Familie-abonnement — se{' '}
            <Link href="/konto/betalinger" className="underline font-medium" style={{ color: 'var(--primary)' }}>
              Betalinger
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  )
}

function ProfileRow({
  id,
  name,
  isPrimary,
  hjemflyt,
  isHjemflytAdmin,
  setProfileHjemflytMeta,
  renameProfile,
  removeProfile,
}: {
  id: string
  name: string
  isPrimary: boolean
  hjemflyt?: HjemflytProfileMeta
  isHjemflytAdmin: boolean
  setProfileHjemflytMeta: (
    profileId: string,
    meta: { kind: 'adult' | 'child'; childEmoji?: string | null } | null,
  ) => { ok: true } | { ok: false; reason: 'forbidden' | 'invalid' }
  renameProfile: (id: string, name: string) => void
  removeProfile: (id: string) => { ok: true } | { ok: false; reason: string }
}) {
  const [removeModalOpen, setRemoveModalOpen] = useState(false)
  const isChild = hjemflyt?.kind === 'child'
  const [editChild, setEditChild] = useState(isChild)
  const [editEmoji, setEditEmoji] = useState<string | null>(hjemflyt?.childEmoji ?? null)

  useEffect(() => {
    setEditChild(hjemflyt?.kind === 'child')
    setEditEmoji(hjemflyt?.childEmoji ?? null)
  }, [hjemflyt?.kind, hjemflyt?.childEmoji])

  const confirmRemove = async () => {
    const server = await deleteSmartvaneDataForProfile(id)
    setRemoveModalOpen(false)
    if (!server.ok) {
      if (typeof window !== 'undefined') {
        window.alert(
          server.error === 'Kan ikke slette SmartVane for hovedprofilen'
            ? server.error
            : `SmartVane kunne ikke ryddes: ${server.error}`,
        )
      }
      return
    }
    const res = removeProfile(id)
    if (!res.ok && typeof window !== 'undefined') {
      window.alert(res.reason === 'last_profile' ? 'Du må ha minst én profil.' : 'Profilen kunne ikke fjernes.')
    }
  }

  return (
    <li className="pb-4 border-b last:border-0 last:pb-0" style={{ borderColor: 'var(--border)' }}>
      <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
        {isPrimary ? 'Hovedprofil' : 'Profil'}
      </p>
      <RenameInline
        id={id}
        initialName={name}
        renameProfile={renameProfile}
        showRemove={!isPrimary}
        onRequestRemove={() => setRemoveModalOpen(true)}
      />
      {isPrimary && (
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          Hovedprofilen kan ikke slettes.
        </p>
      )}

      {isHjemflytAdmin && !isPrimary && (
        <div
          className="mt-3 p-3 rounded-xl space-y-2"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>
            HjemFlyt
          </p>
          <label className="flex items-center gap-2 text-sm cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={editChild}
              onChange={(e) => {
                setEditChild(e.target.checked)
                if (e.target.checked) {
                  setProfileHjemflytMeta(id, { kind: 'child', childEmoji: editEmoji })
                } else {
                  setProfileHjemflytMeta(id, null)
                  setEditEmoji(null)
                }
              }}
            />
            <span style={{ color: 'var(--text)' }}>Barneprofil (leken HjemFlyt-visning)</span>
          </label>
          {editChild && (
            <div className="max-h-48 overflow-y-auto -mx-1 px-1">
              <ChildEmojiPicker
                value={editEmoji}
                onChange={(emo) => {
                  setEditEmoji(emo)
                  setProfileHjemflytMeta(id, { kind: 'child', childEmoji: emo })
                }}
              />
            </div>
          )}
        </div>
      )}

      {!isPrimary && (
        <RemoveProfileConfirmModal
          open={removeModalOpen}
          profileName={name.trim() || 'denne profilen'}
          onClose={() => setRemoveModalOpen(false)}
          onConfirm={confirmRemove}
        />
      )}
    </li>
  )
}

function RemoveProfileConfirmModal({
  open,
  profileName,
  onClose,
  onConfirm,
}: {
  open: boolean
  profileName: string
  onClose: () => void
  onConfirm: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Lukk"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl p-5 shadow-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-profile-title"
      >
        <h3 id="remove-profile-title" className="font-semibold text-sm pr-8" style={{ color: 'var(--text)' }}>
          Fjerne profilen «{profileName}»?
        </h3>
        <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          <span className="font-medium" style={{ color: 'var(--text)' }}>
            OBS:
          </span>{' '}
          Slettingen er <span className="font-semibold" style={{ color: 'var(--text)' }}>permanent</span> og kan ikke
          angres. All økonomidata som hører til profilen — blant annet transaksjoner, budsjett, sparemål, gjeld,
          investeringer og tjenesteabonnement — slettes for godt. Det finnes ingen papirkurv eller gjenoppretting.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ border: '1px solid var(--border)', color: 'var(--text)' }}
            onClick={onClose}
          >
            Avbryt
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{ background: '#c92a2a' }}
            onClick={onConfirm}
          >
            Ja, fjern profilen
          </button>
        </div>
      </div>
    </div>
  )
}

function RenameInline({
  id,
  initialName,
  renameProfile,
  showRemove,
  onRequestRemove,
}: {
  id: string
  initialName: string
  renameProfile: (id: string, name: string) => void
  showRemove?: boolean
  onRequestRemove?: () => void
}) {
  const [value, setValue] = useState(initialName)
  useEffect(() => {
    setValue(initialName)
  }, [initialName])

  const dirty = value.trim() !== initialName.trim()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="min-w-0 flex-1 min-[480px]:max-w-xs px-3 py-2 rounded-xl text-sm"
        style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        aria-label="Profilnavn"
      />
      <button
        type="button"
        disabled={!dirty || !value.trim()}
        className="shrink-0 px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
        style={{
          background: dirty && value.trim() ? 'var(--primary)' : 'var(--border)',
          color: dirty && value.trim() ? '#fff' : 'var(--text-muted)',
        }}
        onClick={() => renameProfile(id, value.trim())}
      >
        Lagre navn
      </button>
      {showRemove && onRequestRemove && (
        <button
          type="button"
          className="shrink-0 px-3 py-2 rounded-xl text-sm font-medium"
          style={{ border: '1px solid var(--border)', color: '#c92a2a' }}
          onClick={onRequestRemove}
        >
          Fjern profil
        </button>
      )}
    </div>
  )
}
