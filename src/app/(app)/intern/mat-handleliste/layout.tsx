import { redirect } from 'next/navigation'

/**
 * Legacy mat-handleliste — kode beholdes, men ruten er skjult for brukere.
 * Sidefelt «Handleliste» og bokmerker peker på /intern/enkel-handleliste.
 */
export const metadata = {
  title: 'Mat og handleliste',
}

export default function InternMatHandlelisteLayout() {
  redirect('/intern/enkel-handleliste')
}
