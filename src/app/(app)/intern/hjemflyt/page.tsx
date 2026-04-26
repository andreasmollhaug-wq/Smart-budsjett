import { redirect } from 'next/navigation'

/** Gammel intern URL – bruker /hjemflyt. */
export default function InternHjemflytRedirect() {
  redirect('/hjemflyt')
}
