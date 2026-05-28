import type { BudgetExportSubject } from './types'

export function slugifyScopeLabel(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'profil'
}

export function buildBudgetPlanFilename(params: {
  year: number
  scopeLabel: string
  subject: BudgetExportSubject
  ext: 'pdf' | 'xlsx'
}): string {
  const { year, scopeLabel, subject, ext } = params
  if (subject === 'all') return `budsjettplan-${year}-alle.${ext}`
  const slug = slugifyScopeLabel(scopeLabel)
  return `budsjettplan-${year}-${slug}.${ext}`
}
