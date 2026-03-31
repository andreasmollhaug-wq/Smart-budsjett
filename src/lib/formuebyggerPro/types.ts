/** Sparingsfrekvens: innbetalinger per år (Excel-kompatibel liste). */
export const SAVINGS_FREQUENCIES = [1, 2, 4, 12, 26, 52] as const
export type SavingsFrequency = (typeof SAVINGS_FREQUENCIES)[number]

/** Rentefrekvens: sammensetninger per år (typisk 12 = månedlig). */
export const COMPOUND_FREQUENCIES = [1, 2, 4, 12, 26, 52] as const
export type CompoundFrequency = (typeof COMPOUND_FREQUENCIES)[number]

export interface FormuebyggerInput {
  /** Nominelt startbeløp (kr) */
  startAmount: number
  /** Årlig brutto avkastning, f.eks. 0.07 */
  annualReturn: number
  /** Beløp per innbetaling (kr) */
  savingsPerPayment: number
  /** Innbetalinger per år */
  savingsFrequency: SavingsFrequency
  /** Simuleringslengde (hele år) */
  years: number
  /** Skatt på avkastning, f.eks. 0.22 */
  taxRate: number
  /** Årlig inflasjon for reell verdi, f.eks. 0.025 */
  inflation: number
  /**
   * Sammensetninger per år. n=12: månedlig r_m = (1+r_å)^(1/12)-1.
   * Andre verdier: n rentetrinn per år med r_step = (1+r_å)^(1/n)-1,
   * fordelt jevnt (første steg i måned som tilsvarer 12/n, 24/n, …).
   */
  compoundFrequency: CompoundFrequency
}

/** Én måned i simuleringen (0-basert global månedsindeks). */
export interface MonthRow {
  globalMonthIndex: number
  /** Kalendermåned 1–12 innen året */
  monthInYear: number
  /** År fra start, 0 = første år */
  yearIndex: number
  ib: number
  savings: number
  extra: number
  /** Brutto avkastning denne måneden */
  grossReturn: number
  tax: number
  ub: number
  /** Kumulativ sparing (kun periodisk sparing, ikke start eller ekstra) */
  cumulativePeriodicSavings: number
  /** Reell verdi ved utgang av denne måneden */
  realValue: number
}

export interface FormuebyggerResult {
  months: MonthRow[]
  /** Per kalenderår (0-basert) */
  years: YearRow[]
  totalPeriodicSavings: number
  totalExtraDeposits: number
  totalDeposits: number
  totalGrossReturn: number
  totalTaxPaid: number
  finalNominal: number
  finalReal: number
  /** Total avkastning / totalt innskudd */
  returnPctOfDeposits: number
}

export interface YearRow {
  yearIndex: number
  ib: number
  annualSavings: number
  annualExtra: number
  annualGrossReturn: number
  annualTax: number
  ub: number
  realValue: number
}

export const MILESTONE_AMOUNTS = [100_000, 500_000, 1_000_000, 5_000_000] as const

export interface MilestoneHit {
  amount: number
  /** År fra start (1-basert for visning) eller null */
  yearReached: number | null
  /** Global månedsindeks (0-basert) eller null */
  monthIndexReached: number | null
}

export interface SensitivityRow {
  annualReturnPct: number
  futureValue: number
  realValue: number
  returnKr: number
  /** Avvik i kr vs. base-case sluttverdi */
  deviationFromBase: number
  isBase: boolean
}
