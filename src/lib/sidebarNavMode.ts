export type SidebarNavMode = 'simple' | 'detailed'

export function normalizeSidebarNavMode(raw: unknown): SidebarNavMode {
  return raw === 'simple' || raw === 'detailed' ? raw : 'detailed'
}
