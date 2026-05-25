import { SIDEBAR_NAV_DETAILED } from '@/lib/sidebarNav'
import { RENOVATION_PROJECT_BASE_PATH } from '@/features/renovation-project/paths'
import { FORUM_BASE_PATH } from '@/lib/forum/constants'

/** Konto-undermeny — speiler KontoNav. */
const KONTO_ROUTE_LABELS: Record<string, string> = {
  '/konto/innstillinger': 'Innstillinger',
  '/konto/kom-i-gang': 'Kom i gang',
  '/konto/budsjett-kategorier': 'Budsjettkategorier',
  '/konto/betalinger': 'Betalinger',
  '/konto/sikkerhet': 'Sikkerhet',
  '/konto/roadmap': 'Roadmap',
  '/konto/koble-til-bank': 'Koble til bank',
  '/konto/importer-transaksjoner': 'Importer transaksjoner',
  '/konto/importer-fra-regnskap': 'Import fra regnskap',
  '/konto/kontakt': 'Kontakt oss',
  '/konto/profiler': 'Profiler',
}

/** Offentlige sider uten innlogget app-shell — vis menneskelig navn uten lenke. */
const PUBLIC_ROUTE_LABELS: Record<string, string> = {
  '/glemt-passord': 'Glemt passord',
  '/tilbakestill-passord': 'Tilbakestill passord',
  '/logg-inn': 'Innlogging',
  '/registrer': 'Registrering',
  '/personvern': 'Personvernerklæring',
  '/vilkar': 'Vilkår',
}

const SIDEBAR_ROUTE_LABELS: Record<string, string> = Object.fromEntries(
  SIDEBAR_NAV_DETAILED.map(({ href, label }) => [href, label]),
)

/** Underfaner og tilleggsruter som ofte dukker opp i AI-svar. */
const EXTRA_ROUTE_LABELS: Record<string, string> = {
  '/budsjett/dashboard': 'Budsjett dashboard',
  '/budsjett/husholdning': 'Budsjett → Husholdning',
  '/budsjett/arsvisning': 'Budsjett → Årsvisning',
  '/transaksjoner/kommende': 'Kommende transaksjoner',
  '/transaksjoner/dashboard': 'Transaksjonsdashboard',
  '/sparing/smartspare': 'smartSpare',
  '/sparing/analyse': 'Sparing → Analyse',
  '/sparing/formuebygger': 'Formuebygger',
  '/gjeld/kalkulator': 'Boliglånskalkulator',
  '/gjeld/studielan-kalkulator': 'Studielånskalkulator',
  '/gjeld/husholdning': 'Gjeld → Husholdning',
  '/abonnementer/sammendrag': 'Abonnementer → Sammendrag',
  '/abonnementer/avsluttet': 'Abonnementer → Avsluttede',
  '/intern/mat-handleliste/handleliste': 'Handleliste',
  '/intern/mat-handleliste/start': 'Mat og handleliste',
  '/hjemflyt/start': 'Hjemflyt',
  [RENOVATION_PROJECT_BASE_PATH]: 'Oppussing',
  [FORUM_BASE_PATH]: 'Forum',
  '/enkelexcel-ai': 'dottir AI',
  '/konto': 'Min konto',
}

/** Lengste stier først — unngår at `/konto` matcher før `/konto/betalinger`. */
export const AI_ROUTE_LABELS: Record<string, string> = {
  ...SIDEBAR_ROUTE_LABELS,
  ...EXTRA_ROUTE_LABELS,
  ...KONTO_ROUTE_LABELS,
  ...PUBLIC_ROUTE_LABELS,
}

const SORTED_ROUTE_PATHS = Object.keys(AI_ROUTE_LABELS).sort((a, b) => b.length - a.length)

function routeToMarkdownLink(path: string): string {
  const label = AI_ROUTE_LABELS[path]
  if (!label) return path
  if (path in PUBLIC_ROUTE_LABELS) return label
  return `[${label}](${path})`
}

/** Erstatt synlige `/stier` i assistent-svar med klikkbare menynavn (sikkerhetsnett). */
export function sanitizeAiReplyMarkdown(text: string): string {
  if (!text.trim()) return text

  let out = text

  // «Betalinger (/konto/betalinger)» → markdown-lenke
  for (const path of SORTED_ROUTE_PATHS) {
    const label = AI_ROUTE_LABELS[path]!
    const parenPattern = new RegExp(
      `(${escapeRegExp(label)})\\s*\\(\\s*${escapeRegExp(path)}\\s*\\)`,
      'gi',
    )
    out = out.replace(parenPattern, routeToMarkdownLink(path))
  }

  // `/konto/betalinger` i backticks
  for (const path of SORTED_ROUTE_PATHS) {
    const backtickPattern = new RegExp(`\`${escapeRegExp(path)}\``, 'g')
    out = out.replace(backtickPattern, routeToMarkdownLink(path))
  }

  // Frittstående `/stier` (ordgrense — ikke midt i e-post eller annen tekst)
  for (const path of SORTED_ROUTE_PATHS) {
    const barePattern = new RegExp(`(?<![\\w@])${escapeRegExp(path)}(?![\\w/])`, 'g')
    out = out.replace(barePattern, (match, offset, whole) => {
      // Ikke erstatte inne i eksisterende markdown-lenke `(path)`
      const before = whole.slice(Math.max(0, offset - 2), offset)
      const after = whole.slice(offset + match.length, offset + match.length + 1)
      if (before === '](' || after === ')') return match
      // Ikke dobbelt-erstatte allerede lenket label
      if (before.endsWith('[') || before.endsWith('](')) return match
      return routeToMarkdownLink(path)
    })
  }

  // Rydd tomme parenteser og doble mellomrom etter erstatning
  out = out.replace(/\(\s*\)/g, '')
  out = out.replace(/  +/g, ' ')

  return out
}

/** Gjør eldre ren-tekst-svar (Sammendrag:/Detaljer:) lesbare som Markdown. */
export function normalizePlainTextAiSections(text: string): string {
  if (/^#{1,3}\s/m.test(text)) return text

  return text
    .replace(/^Sammendrag:\s*$/im, '## Sammendrag\n')
    .replace(/^Detaljer:\s*$/im, '\n## Detaljer\n')
}

/** Klargjør assistent-svar for visning i chat (Markdown + vennlige lenker). */
export function prepareAiReplyForDisplay(text: string): string {
  return sanitizeAiReplyMarkdown(normalizePlainTextAiSections(text))
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
