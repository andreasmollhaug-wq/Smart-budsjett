/** Gjenbruker samme lånetyper som Debt for konsistent visning (ikke koblet til Debt). */
export type CreditorRegistryLoanType =
  | 'mortgage'
  | 'loan'
  | 'consumer_loan'
  | 'refinancing'
  | 'student_loan'
  | 'credit_card'
  | 'other'

export const CREDITOR_REGISTRY_LOAN_TYPES: CreditorRegistryLoanType[] = [
  'mortgage',
  'loan',
  'consumer_loan',
  'refinancing',
  'student_loan',
  'credit_card',
  'other',
]

export interface CreditorRegistryLoan {
  id: string
  name: string
  remainingAmount: number
  monthlyPayment: number
  interestRate: number
  type: CreditorRegistryLoanType
  note?: string
}

export interface CreditorRegistryGroup {
  id: string
  name: string
  loans: CreditorRegistryLoan[]
}

export type CreditorSortMode =
  | 'name_asc'
  | 'remaining_desc'
  | 'remaining_asc'
  | 'monthly_desc'
  | 'loanCount_desc'

export type LoanSortMode =
  | 'name_asc'
  | 'remaining_desc'
  | 'remaining_asc'
  | 'interest_desc'
  | 'monthly_desc'

export interface CreditorRegistryPrefs {
  creditorSort: CreditorSortMode
  loanSort: LoanSortMode
  hasReviewedSubtotals?: boolean
  standaloneInfoAcknowledged?: boolean
  checklistDismissed?: boolean
  /** Minimert visning — brukeren kan åpne igjen uten å miste fremdrift. */
  checklistCollapsed?: boolean
}

export type CreditorRegistryChecklistStepId =
  | 'first_creditor_and_loan'
  | 'complete_loan_fields'
  | 'all_creditors'
  | 'review_subtotals'
  | 'understand_standalone'

export type CreditorRegistryChecklistOverrides = Partial<
  Record<CreditorRegistryChecklistStepId, boolean>
>

export interface CreditorRegistryState {
  creditors: CreditorRegistryGroup[]
  prefs?: CreditorRegistryPrefs
  checklistOverrides?: CreditorRegistryChecklistOverrides
}

export type CreditorRegistryActionResult =
  | { ok: true; id?: string }
  | { ok: false; reason: 'household_readonly' | 'not_found' | 'invalid' | 'empty_name' }
