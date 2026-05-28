import type { BudgetCategoryFrequency } from '@/lib/utils'

const LABELS: Record<BudgetCategoryFrequency, string> = {
  monthly: 'Månedlig',
  yearly: 'Årlig',
  quarterly: 'Kvartalsvis',
  semiAnnual: 'Halvårlig',
  weekly: 'Ukentlig',
  once: 'Engang',
}

export function formatBudgetPlanFrequency(frequency: BudgetCategoryFrequency): string {
  return LABELS[frequency] ?? frequency
}
