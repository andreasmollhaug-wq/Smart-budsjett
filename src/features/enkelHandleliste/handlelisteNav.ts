import { ENKEL_HANDLELISTE_IN_SIDEBAR } from './featureFlags'

/** Sidefelt «Handleliste» — enkel handleliste når lansert (flag). */
export const HANDLELISTE_NAV_HREF = ENKEL_HANDLELISTE_IN_SIDEBAR
  ? '/intern/enkel-handleliste'
  : '/intern/mat-handleliste/handleliste'

export function isHandlelisteNavActive(pathname: string): boolean {
  if (ENKEL_HANDLELISTE_IN_SIDEBAR) {
    return pathname.startsWith('/intern/enkel-handleliste')
  }
  return pathname.startsWith('/intern/mat-handleliste')
}
