import 'server-only'

import { cookies } from 'next/headers'
import { parseSmartvaneProfileCookie, SMARTVANE_PROFILE_COOKIE } from './smartvaneProfileCookie'

/** Server: aktiv profil for SmartVane-forespørsler. */
export async function getSmartvaneProfileIdFromCookies(): Promise<string> {
  const jar = await cookies()
  return parseSmartvaneProfileCookie(jar.get(SMARTVANE_PROFILE_COOKIE)?.value)
}
