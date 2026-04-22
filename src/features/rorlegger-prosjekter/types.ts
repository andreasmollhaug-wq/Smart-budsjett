export type RegionId = 'ost' | 'sor' | 'vest' | 'midtNord'

export const REGION_LABELS: Record<RegionId, string> = {
  ost: 'Øst',
  sor: 'Sør',
  vest: 'Vest',
  midtNord: 'Midt-Nord',
}

export type ProjectStatus = 'paaGaende' | 'avsluttet'

export type ContractType = 'fastpris' | 'lopende'

export type AttachmentKind = 'kontrakt' | 'endringsordre' | 'annet'

export interface RorleggerAttachment {
  id: string
  name: string
  type: AttachmentKind
  date: string
}

/** Kostnadsrad for «finansiell status»-fordeling. */
export interface RorleggerFinancialLine {
  label: string
  budgetNok: number
  actualNok: number
}

/** Tydelig nok: grønt / gul / rød for pilotvisning. */
export type RorleggerFinancialHealth = 'underRamme' | 'risikoOverRamme' | 'overRamme'

/** Utvidet økonomibilde per prosjekt (demo). `budgetNok`/`actualNok` brukes fremdeles for lister. */
export interface RorleggerFinancialDetail {
  /** Godkjent prosjektramme. */
  approvedBudgetNok: number
  /** Påløpt / bokført kostnadsføring. */
  accruedOrActualNok: number
  /** Fakturert kunde hittil (kan avvike fra bokført kost). */
  invoicedToDateNok: number
  /** Forpliktet (ordre, ikke fullt fakturert/periodisert). */
  committedNok: number
  /** Utbetalt fra prosjekt (leverandører). */
  paidOutNok: number
  /** Prognose sluttkost (EAC). */
  forecastAtCompletionNok: number
  /** Gjenstående udisponert reserve (risiko/EO). */
  contingencyRemainingNok: number
  health: RorleggerFinancialHealth
  /** Valgfri oppdeling (material, arbeid, osv.) */
  lines?: RorleggerFinancialLine[]
}

export interface RorleggerProject {
  id: string
  name: string
  region: RegionId
  status: ProjectStatus
  contractType: ContractType
  /** yyyy-mm-dd */
  startDate: string
  /** yyyy-mm-dd — valgfri for pågående uten planlagt slutt i demo */
  endDate?: string
  budgetNok: number
  actualNok: number
  customerOrSite: string
  summary: string
  notes?: string
  attachments: RorleggerAttachment[]
  /** Full finans — kun der det er fylt ut (f.eks. pilot Jessheim). */
  financialDetail?: RorleggerFinancialDetail
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  paaGaende: 'Pågående',
  avsluttet: 'Avsluttet',
}

export const CONTRACT_LABELS: Record<ContractType, string> = {
  fastpris: 'Fastpris',
  lopende: 'Løpende regning',
}

export const ATTACHMENT_TYPE_LABELS: Record<AttachmentKind, string> = {
  kontrakt: 'Kontrakt',
  endringsordre: 'Endringsordre',
  annet: 'Annet',
}

export const FINANCIAL_HEALTH_LABELS: Record<RorleggerFinancialHealth, string> = {
  underRamme: 'Under ramme',
  risikoOverRamme: 'Risiko for over ramme',
  overRamme: 'Over ramme',
}
