const CONSENT_PENDING_KEY = 'dottir_neonomics_consent_navigate'

/** Brukes når full navigasjon til bank returnerer (mobil / blokkert popup). */
export function markNeonomicsConsentNavigatePending(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(CONSENT_PENDING_KEY, '1')
}

export function consumeNeonomicsConsentNavigatePending(): boolean {
  if (typeof sessionStorage === 'undefined') return false
  const v = sessionStorage.getItem(CONSENT_PENDING_KEY)
  if (v) sessionStorage.removeItem(CONSENT_PENDING_KEY)
  return v === '1'
}

/** Mobil og små skjermer: samtykke i samme fane er mer pålitelig enn popup. */
export function prefersSameTabBankConsent(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(max-width: 767px)').matches) return true
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.innerWidth < 768
  return coarse && narrow
}

export type OpenBankConsentResult = 'popup' | 'navigate'

export type OpenBankConsentOutcome = {
  mode: OpenBankConsentResult
  popup: Window | null
}

/**
 * Åpner bank-URL for samtykke. Returnerer `navigate` når hele siden byttes (mobil/blokkert popup).
 */
export function openBankConsentUrl(bankAuthUrl: string): OpenBankConsentOutcome {
  if (prefersSameTabBankConsent()) {
    markNeonomicsConsentNavigatePending()
    window.location.assign(bankAuthUrl)
    return { mode: 'navigate', popup: null }
  }

  const w = 480
  const h = 720
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - w) / 2))
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - h) / 2))
  const popup = window.open(
    bankAuthUrl,
    'dottir-bank-consent',
    `popup=yes,width=${w},height=${h},left=${left},top=${top}`,
  )

  if (!popup) {
    markNeonomicsConsentNavigatePending()
    window.location.assign(bankAuthUrl)
    return { mode: 'navigate', popup: null }
  }

  return { mode: 'popup', popup }
}
