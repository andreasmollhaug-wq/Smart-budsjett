/** Kundetekst for «Koble til bank» — én kilde for UI-komponenter. */

export const BANK_CONNECT_PAGE_INGRESS =
  'Koble DNB for å hente transaksjoner trygt via banken.'

export const BANK_CONNECT_HELP_TITLE = 'Slik kobler du til bank'

export const BANK_CONNECT_HELP_STEPS = [
  'Velg profil hvis dere er flere i husholdningen.',
  'Trykk Koble DNB — du sendes til banken og logger inn der.',
  'Når du er tilbake, er banken koblet.',
  'Trykk Hent transaksjoner, eller slå på automatisk henting hver dag.',
  'Under Din bank velger du hvilke kontoer som skal hentes (standard: alle).',
  'Transaksjoner du ikke har møtt før, kartlegger du under Importer transaksjoner. Resten kan legges inn automatisk.',
] as const

export const BANK_CONNECT_HELP_PASSWORD_NOTE =
  'Dottir lagrer ikke bankpassordet ditt. Du gir samtykke hos banken.'

export const BANK_CONNECT_HELP_HOUSEHOLD_NOTE =
  'Hver profil kobler sin egen bank. Partnerens transaksjoner vises på deres profil.'

export const BANK_CONNECT_HELP_SANDBOX_NOTE =
  'Dette er testmiljø — du bruker testbruker hos banken.'

export const BANK_CONNECT_HELP_MORE_BANKS_NOTE = 'Flere banker kommer senere.'

export const BANK_CONNECT_SECTION_TITLE = 'Din bank'

export const BANK_CONNECT_PANEL_TITLE = 'Koble DNB'

export const BANK_CONNECT_PANEL_INGRESS =
  'Du bekrefter hos banken din. Vi lagrer ikke passordet ditt.'

export const BANK_CONNECT_BTN_CONNECT = 'Koble DNB'
export const BANK_CONNECT_BTN_CONNECTING = 'Kobler…'
export const BANK_CONNECT_BTN_FETCH = 'Hent transaksjoner'
export const BANK_CONNECT_BTN_DISCONNECT = 'Koble fra bank'
export const BANK_CONNECT_BTN_RETRY = 'Prøv igjen'
export const BANK_CONNECT_BTN_MAP = 'Gå til kartlegging'

export const BANK_CONNECT_AUTO_SYNC_LABEL = 'Automatisk hver dag'
export const BANK_CONNECT_AUTO_SYNC_HINT =
  'Henter og importerer transaksjoner ca. kl. 10 når vi kjenner kategorien fra før.'

export const BANK_CONNECT_STATUS_CONNECTED = 'Koblet'
export const BANK_CONNECT_STATUS_NEEDS_CONSENT = 'Må bekreftes på nytt hos banken'

export const BANK_CONNECT_LAST_SYNC_LABEL = 'Sist hentet'
export const BANK_CONNECT_LAST_SYNC_NEVER = 'Ikke hentet ennå'
export const BANK_CONNECT_PENDING_LABEL = 'Trenger kategori'

export const BANK_CONNECT_DETAILS_TOGGLE = 'Vis detaljer'
export const BANK_CONNECT_DETAILS_ACCOUNT = 'Konto'

export const BANK_CONNECT_ACCOUNTS_SECTION = 'Kontoer å hente fra'
export const BANK_CONNECT_ACCOUNTS_SECTION_HINT =
  'Velg hvilke kontoer som skal inkluderes når du henter transaksjoner. Du kan endre valget når som helst.'
export const BANK_CONNECT_ACCOUNTS_SINGLE_HINT =
  'Denne kontoen hentes automatisk. Kobler du flere kontoer i banken, oppdater listen.'
export const BANK_CONNECT_ACCOUNTS_OVERVIEW_TITLE = 'Oversikt per konto'
export const BANK_CONNECT_ACCOUNTS_OVERVIEW_HINT =
  'Viser siste henting og antall transaksjoner importert eller som venter på kartlegging.'
export const BANK_CONNECT_ACCOUNTS_SAVE = 'Lagre kontovalg'
export const BANK_CONNECT_ACCOUNTS_SAVE_BUSY = 'Lagrer…'
export const BANK_CONNECT_ACCOUNTS_REFRESH = 'Oppdater kontolisten'
export const BANK_CONNECT_ACCOUNTS_COL_ACCOUNT = 'Konto'
export const BANK_CONNECT_ACCOUNTS_COL_INCLUDED = 'Hentes'
export const BANK_CONNECT_ACCOUNTS_COL_LAST_SYNC = 'Sist hentet'
export const BANK_CONNECT_ACCOUNTS_COL_IMPORTED = 'Importert'
export const BANK_CONNECT_ACCOUNTS_COL_PENDING = 'Venter kartlegging'
export const BANK_CONNECT_ACCOUNTS_YES = 'Ja'
export const BANK_CONNECT_ACCOUNTS_NO = 'Nei'
export const BANK_CONNECT_ACCOUNTS_EMPTY = 'Ingen kontoer registrert ennå.'

export function formatBankSyncToastBody(meta: {
  accounts?: Array<{
    label: string
    fetched: number
    imported: number
    pending: number
    duplicate: number
  }>
  importedCount: number
  pendingCount: number
  duplicateCount: number
}): string {
  const parts: string[] = []
  const acc = meta.accounts ?? []
  if (acc.length > 1) {
    parts.push(`${acc.length} kontoer hentet.`)
  }
  if (meta.importedCount > 0) {
    parts.push(`${meta.importedCount} importert automatisk.`)
  }
  if (meta.pendingCount > 0) {
    parts.push(`${meta.pendingCount} trenger kartlegging.`)
  }
  if (meta.duplicateCount > 0) {
    parts.push(`${meta.duplicateCount} var allerede importert.`)
  }
  if (parts.length === 0) {
    return 'Ingen nye transaksjoner i valgt periode.'
  }
  return parts.join(' ')
}

export const BANK_CONNECT_POST_CONNECT_HINT =
  'Banken er koblet. Trykk Hent transaksjoner for å hente det siste.'
export const BANK_CONNECT_POST_CONNECT_DISMISS = 'Lukk'

export const BANK_CONNECT_HISTORY_TITLE = 'Siste hentinger'
export const BANK_CONNECT_HISTORY_HINT =
  'Kartlegging av ukjente transaksjoner skjer under Importer transaksjoner.'

export const BANK_CONNECT_HISTORY_EMPTY =
  'Ingen hentinger ennå. Hent transaksjoner for å komme i gang.'

export const BANK_CONNECT_SYNC_FAIL_PREFIX = 'Siste henting feilet'

export const BANK_CONNECT_TOAST_CONNECTED_TITLE = 'Bank koblet'
export const BANK_CONNECT_TOAST_CONNECTED_BODY =
  'Trykk Hent transaksjoner for å hente det siste.'

export const BANK_CONNECT_ERROR_CALLBACK =
  'Du må fullføre innloggingen hos banken. Trykk Koble DNB igjen.'
export const BANK_CONNECT_ERROR_UNAUTHORIZED = 'Du må være innlogget.'
export const BANK_CONNECT_ERROR_NOT_AVAILABLE = 'Bankkobling er ikke tilgjengelig.'
export const BANK_CONNECT_ERROR_GENERIC = 'Kunne ikke nå banken akkurat nå. Prøv om litt.'
export const BANK_CONNECT_ERROR_FETCH = 'Kunne ikke hente transaksjoner.'
export const BANK_CONNECT_ERROR_CONNECT = 'Kunne ikke koble bank.'

export function mapBankConnectError(
  status: number,
  body?: { error?: string } | null,
): string {
  if (status === 401) return BANK_CONNECT_ERROR_UNAUTHORIZED
  if (status === 404) return BANK_CONNECT_ERROR_NOT_AVAILABLE
  const msg = body?.error?.trim()
  if (msg && msg.length <= 200) return msg
  return BANK_CONNECT_ERROR_GENERIC
}
