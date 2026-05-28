import { buildBudgetPlanExportPayload } from './buildBudgetPlanExportPayload'
import { resolveBudgetExportScopes, type ResolveBudgetExportScopesCtx } from './resolveBudgetExportScopes'
import type { BudgetExportLayout, BudgetExportSubject, BudgetPlanExportInput, BudgetPlanScopePayload } from './types'

export type BuildBudgetPlanScopesPayloadOptions = {
  subject: BudgetExportSubject
  ctx: ResolveBudgetExportScopesCtx
  year: number
  layout: BudgetExportLayout
  monthIndex: number
  onlyLinesWithAmounts: boolean
}

export function buildBudgetPlanScopesPayload(
  options: BuildBudgetPlanScopesPayloadOptions,
): BudgetPlanScopePayload[] {
  const { subject, ctx, layout, monthIndex, onlyLinesWithAmounts } = options
  const scopes = resolveBudgetExportScopes(subject, ctx)
  return scopes.map((scope) =>
    buildBudgetPlanExportPayload(scope.categories, {
      layout,
      monthIndex,
      onlyLinesWithAmounts,
      scopeLabel: scope.label,
    }),
  )
}

export function buildBudgetPlanExportInput(
  options: BuildBudgetPlanScopesPayloadOptions & { generatedAt: Date },
): BudgetPlanExportInput {
  const scopes = resolveBudgetExportScopes(options.subject, options.ctx)
  return {
    year: options.year,
    layout: options.layout,
    monthIndex: options.monthIndex,
    onlyLinesWithAmounts: options.onlyLinesWithAmounts,
    generatedAt: options.generatedAt,
    scopes,
  }
}

export function hasBudgetPlanExportData(scopes: ReturnType<typeof resolveBudgetExportScopes>): boolean {
  return scopes.some((s) => s.categories.length > 0)
}
