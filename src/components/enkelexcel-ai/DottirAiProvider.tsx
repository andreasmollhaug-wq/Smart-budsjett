'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { useDottirAiChat, type DottirAiChatState } from '@/components/enkelexcel-ai/useDottirAiChat'
import DottirAiChatModal from '@/components/enkelexcel-ai/DottirAiChatModal'
import DottirAiFab from '@/components/enkelexcel-ai/DottirAiFab'
import AiBuyCreditsModal from '@/components/enkelexcel-ai/AiBuyCreditsModal'
import {
  readDottirAiFabPrefs,
  type DottirAiFabPrefs,
  writeDottirAiFabPrefs,
} from '@/lib/dottirAiFabPrefs'
import { markDottirAiOpened } from '@/lib/dottirAiEngagementInvite'

type DottirAiContextValue = DottirAiChatState & {
  isOpen: boolean
  isMobileExpanded: boolean
  open: () => void
  close: () => void
  openFullPage: () => void
  toggleMobileExpanded: () => void
  collapseMobile: () => void
  fabPrefs: DottirAiFabPrefs
  setFabPrefs: (prefs: DottirAiFabPrefs) => void
}

const DottirAiContext = createContext<DottirAiContextValue | null>(null)

export function useDottirAi(): DottirAiContextValue {
  const ctx = useContext(DottirAiContext)
  if (!ctx) {
    throw new Error('useDottirAi må brukes innenfor DottirAiProvider')
  }
  return ctx
}

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
}

export default function DottirAiProvider({ children }: { children: ReactNode }) {
  const chat = useDottirAiChat()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)
  const [fabPrefs, setFabPrefsState] = useState<DottirAiFabPrefs>(() =>
    typeof window !== 'undefined' ? readDottirAiFabPrefs() : { hidden: false, hiddenUntil: null },
  )

  const open = useCallback(() => {
    markDottirAiOpened()
    setIsMobileExpanded(false)
    setIsOpen(true)
  }, [])
  const close = useCallback(() => {
    setIsMobileExpanded(false)
    setIsOpen(false)
  }, [])

  const openFullPage = useCallback(() => {
    setIsMobileExpanded(false)
    setIsOpen(false)
    router.push('/enkelexcel-ai')
  }, [router])

  const toggleMobileExpanded = useCallback(() => {
    setIsMobileExpanded((v) => !v)
  }, [])

  const collapseMobile = useCallback(() => {
    setIsMobileExpanded(false)
  }, [])

  const setFabPrefs = useCallback((prefs: DottirAiFabPrefs) => {
    writeDottirAiFabPrefs(prefs)
    setFabPrefsState(prefs)
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return
      if (isEditableTarget(e.target)) return
      e.preventDefault()
      open()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  const value = useMemo(
    () => ({
      ...chat,
      isOpen,
      isMobileExpanded,
      open,
      close,
      openFullPage,
      toggleMobileExpanded,
      collapseMobile,
      fabPrefs,
      setFabPrefs,
    }),
    [
      chat,
      isOpen,
      isMobileExpanded,
      open,
      close,
      openFullPage,
      toggleMobileExpanded,
      collapseMobile,
      fabPrefs,
      setFabPrefs,
    ],
  )

  return (
    <DottirAiContext.Provider value={value}>
      {children}
      <DottirAiChatModal />
      <DottirAiFab />
      {chat.usage ? (
        <AiBuyCreditsModal
          open={chat.buyModalOpen}
          usage={chat.usage}
          context={chat.buyModalContext}
          checkoutLoading={chat.checkoutLoading}
          onClose={() => {
            chat.setBuyModalOpen(false)
            chat.setBuyModalContext('at_quota')
          }}
          onCheckout={() => void chat.startAiCreditsCheckout()}
        />
      ) : null}
    </DottirAiContext.Provider>
  )
}
