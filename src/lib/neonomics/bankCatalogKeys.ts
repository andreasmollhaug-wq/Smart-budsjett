/** Klient + server: nøkkel i store.bankPendingNeonomics (profileId:bankId). */
export function bankPendingNeonomicsKey(profileId: string, bankId: string): string {
  return `${profileId}:${bankId}`
}
