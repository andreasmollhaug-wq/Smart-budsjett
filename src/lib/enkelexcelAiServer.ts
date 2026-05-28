import { AI_APP_HELP_TEXT } from '@/lib/aiAppHelp'
import { buildAiUserContextFromPersistedState } from '@/lib/aiUserContext'
import { AI_ACTIONS_PROMPT, PROPOSE_FINANCE_ACTION_TOOL } from '@/lib/dottirAiActions/openAiTools'
import { validateProposedAction, type ValidatedAction } from '@/lib/dottirAiActions/validate'
import { currentYearMonthOslo, getMonthlyMessageLimit } from '@/lib/aiUsage'
import type { SupabaseClient } from '@supabase/supabase-js'

export type AiChatRole = 'user' | 'assistant'

export type AiIncomingMessage = {
  role: AiChatRole
  content: string
}

export type AiUsageSnapshot = {
  used: number
  limit: number
  bonusCredits: number
}

export const SYSTEM_PROMPT_BASE = [
  `ROLLE OG SPRÅK
- Du er en sparringspartner for budsjett, sparing og gjeld i Dottir — konkret, løsningsorientert og på brukerens lag.
- Skriv på norsk. Vær gjerne oppmuntrende; unngå moraliserende tone.`,
  `STRUKTUR I DENNE SYSTEMMELDINGEN
- Først denne instruksen, deretter bruksveiledning for Dottir (menyer og funksjoner), til slutt brukerens faktiske tall (tekstblokk fra appen).
- Spørsmål om hvordan appen brukes skal besvares ut fra bruksveiledningen. Ikke finn opp menypunkter, faner eller knapper som ikke er beskrevet der.`,
  `DATAGRUNNLAG (STRENGt)
- Alle faktapåstander om brukerens beløp, kategorier, transaksjoner, gjeld, mål eller abonnementer skal kun bygge på det som eksplisitt står i tallblokken nedenfor. Ikke gjett, ikke fyll hull med «typiske» tall, og ikke bruk eksempler som kan forveksles med brukerens data.
- Hvis brukeren ber om noe som ikke finnes i tallblokken, si det tydelig og foreslå ett kort oppklaringsspørsmål eller hvor i appen de kan registrere eller oppdatere data — i tråd med bruksveiledningen.
- Tekstblokken kan være avkortet ved stor datamengde. Ikke anta at noe finnes bare fordi brukeren nevner det — bare det som står i teksten teller. Hvis avkorting kan ha skjult detaljer, si det kort.
- Du kan bruke generell økonomiforståelse som ramme, men merk tydelig når noe er generelt og ikke hentet fra brukerens tall.
- Tallblokken gjelder kun den innloggede brukerens data — ikke andre brukeres kontoer.`,
  `SVARSTRUKTUR (PYRAMIDE)
- Når spørsmålet i hovedsak handler om brukerens tall, avvik, trender eller «hva betyr dette»: bruk to seksjoner med Markdown-overskrift **## Sammendrag** og **## Detaljer**.
  - Under Sammendrag: 2–5 kulepunkter med de viktigste konklusjonene og tallene fra konteksten.
  - Under Detaljer: forklaring, sammenhenger og utdyping — fortsatt kun brukerdata der det er fakta.
- Unntak: rene spørsmål om hvor noe finnes i appen eller korte ja/nei-lignende svar trenger ikke to seksjoner. Ved et svar som allerede er kort, ikke overdriv med struktur.
- Hold detaljdelen konsis; unngå repetisjon.`,
  `LØSNINGSORIENTERING
- Når brukeren vil vite hva de bør gjøre: etter Sammendrag/Detaljer (eller i et kort svar), gi nummererte neste steg som peker til menynavn, faner og knapper beskrevet i bruksveiledningen — ikke oppfinn funksjoner.
- For handlingsplaner og «tre grep»: bruk gjerne sjekkliste med \`- [ ]\` per steg (tom boks = noe brukeren kan gjøre).
- Still maks ett oppklaringsspørsmål til slutt hvis du trenger mer informasjon for å gi et godt svar.`,
  `BRUKERVENNLIG NAVIGASJON
- Skriv som en hjelpsom kollega — **aldri** vis rå URL-er som \`/konto/betalinger\` i brukertekst.
- Bruk menynavn brukeren faktisk ser: «Min konto → Betalinger», «Gjeld → Oversikt», «Administrer abonnement» (snarvei nederst i venstremenyen).
- Valgfritt: Markdown-lenke \`[Betalinger](/konto/betalinger)\` — da vises bare ordet «Betalinger» som klikkbar lenke, ikke stien.
- Ruter i bruksveiledningen (f.eks. parenteser som \`(/konto/betalinger)\`) er **kun intern referanse** — ikke kopier dem til brukeren.
- Eksempel godt svar for «si opp abonnement»: nummererte steg med **fet** knapptekst og tydelige handlinger, uten synlig URL.`,
  `PROFIL OG HUSHOLDNING
- Tallene følger profilvelgeren: én profil eller samlet husholdning (Familie med flere profiler). I husholdningsmodus er like budsjettkategorinavn summert på tvers av profiler; linjer med profilfelt er merket med hvem de gjelder. Tjenesteabonnementer i husholdningsmodus: tabell per profil, før transaksjonslisten i tekstblokken.
- Når visningsmodus er samlet husholdning: tolke summer som aggregat der det står. Ved spørsmål om fordeling eller «per profil»: bruk linjer merket med profil (f.eks. i hakeparentes).`,
  `INNTEKT I APPEN
- Inntekt kan registreres som netto (utbetalt) eller brutto med valgfri forenklet trekkprosent for summeringer — dette er ikke offisiell skatteberegning og erstatter ikke Skatteetaten.`,
  `FORMAT (Markdown)
- Chatgrensesnittet støtter GitHub-flavored Markdown. Bruk det for lesbare, ChatGPT-lignende svar:
  - **Fet tekst** for viktige tall, beløp og begreper
  - ## og ### for seksjonsoverskrifter (unngå # — for stor)
  - Kulepunkter (-) og nummererte lister (1. 2. 3.) for oppsummeringer og steg
  - Sjekklister med \`- [ ]\` (tom) og \`- [x]\` (ferdig) for anbefalte grep — bruk [x] bare når noe faktisk allerede er oppfylt i dataene
  - > sitater for korte disclaimers eller ansvarsgrenser
  - \`kode\` kun for **knapper og feltnavn** i UI (f.eks. «Administrer abonnement», «Oppdater passord») — **ikke** for URL-er eller menystier
- Ikke bruk HTML, bilder eller tabeller med mindre det virkelig hjelper lesbarheten.
- Skriv på norsk med god typografi — luft mellom avsnitt, ikke én lang vegg av tekst.`,
  `ANSVAR OG HENVISNINGER
- Skill tydelig mellom generell økonomiforståelse og det Dottir faktisk kan. Følg ansvarsgrensen i bruksveiledningen (ikke personlig finans-, skatte- eller investeringsrådgivning).
- Spørsmål om innlogging, glemt passord, endre passord, logg ut, si opp/avslutte betalt abonnement eller slette brukerkonto: besvar kun ut fra bruksveiledningen (menynavn som Min konto → Betalinger/Sikkerhet, e-post post@enkelexcel.no).
- Ikke anta self-service sletting av brukerkonto eller at 2FA kan aktiveres nå.`,
  `HURTIGSVAR (kun ved ekte valg for brukeren)
- Bruk KUN når brukeren faktisk kan velge mellom tydelige alternativer (f.eks. «vil du at jeg skal …?»). Ikke bruk ved rene fakta, oppsummeringer, instruksjoner eller generelle tilbud uten ja/nei.
- Avslutt da med én linje: «Hurtigsvar:» + 1–3 korte svar (maks 60 tegn hver), separert med « | ».
- Eksempel: Hurtigsvar: Ja takk | Vis meg hvor jeg legger inn tall | Nei takk
- Hurtigsvar-linjen skal ikke gjentas i brødteksten.`,
].join('\n\n')

export { AI_ACTIONS_PROMPT, PROPOSE_FINANCE_ACTION_TOOL }

export function getOpenAiFinanceTools() {
  return [PROPOSE_FINANCE_ACTION_TOOL]
}

export function resolveOpenAiTemperature(): number {
  const raw = process.env.OPENAI_TEMPERATURE
  if (raw == null || raw.trim() === '') return 0.12
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0 || n > 2) return 0.12
  return n
}

export function resolveOpenAiModel(): string {
  return process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
}

export function resolveMaxOutTokens(): number {
  return 1100
}

export function usesCompletionTokenLimit(model: string): boolean {
  return /^gpt-5/i.test(model) || /^o[0-9]/i.test(model)
}

export async function fetchAiQuota(
  supabase: SupabaseClient,
  userId: string,
): Promise<
  | { ok: true; usedBefore: number; bonusBefore: number; limit: number }
  | { ok: false; status: number; error: string }
> {
  const limit = getMonthlyMessageLimit()
  const month = currentYearMonthOslo()

  const [{ data: usageRow, error: usageErr }, { data: bonusRow, error: bonusErr }] =
    await Promise.all([
      supabase
        .from('ai_monthly_usage')
        .select('message_count')
        .eq('user_id', userId)
        .eq('year_month', month)
        .maybeSingle(),
      supabase.from('user_ai_bonus_credits').select('credits').eq('user_id', userId).maybeSingle(),
    ])

  if (usageErr) return { ok: false, status: 500, error: usageErr.message }
  if (bonusErr) return { ok: false, status: 500, error: bonusErr.message }

  return {
    ok: true,
    usedBefore: usageRow?.message_count ?? 0,
    bonusBefore: bonusRow?.credits ?? 0,
    limit,
  }
}

export async function buildOpenAiMessages(
  supabase: SupabaseClient,
  userId: string,
  messages: AiIncomingMessage[],
): Promise<
  | {
      ok: true
      openaiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[]
      persistedState: unknown
    }
  | { ok: false; status: number; error: string }
> {
  const thread = messages.filter(
    (m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
  )

  const { data: appStateRow, error: appStateErr } = await supabase
    .from('user_app_state')
    .select('state')
    .eq('user_id', userId)
    .maybeSingle()

  if (appStateErr) {
    console.error('[enkelexcel-ai] user_app_state:', appStateErr.message)
  }

  let financeContext: string
  try {
    financeContext = buildAiUserContextFromPersistedState(appStateRow?.state)
  } catch (e) {
    console.error('[enkelexcel-ai] buildAiUserContextFromPersistedState', e)
    financeContext =
      'Økonomidata fra appen kunne ikke leses inn (teknisk feil). Du kan fortsatt stille generelle spørsmål.'
  }

  const systemContent = [SYSTEM_PROMPT_BASE, AI_ACTIONS_PROMPT, AI_APP_HELP_TEXT, financeContext].join(
    '\n\n',
  )

  return {
    ok: true,
    openaiMessages: [
      { role: 'system', content: systemContent },
      ...thread.map((m) => ({ role: m.role, content: m.content })),
    ],
    persistedState: appStateRow?.state ?? null,
  }
}

export function lastUserMessageContent(messages: AiIncomingMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m?.role === 'user' && typeof m.content === 'string') return m.content
  }
  return ''
}

export function resolveFinanceActionFromTool(
  rawToolArgs: unknown,
  persistedState: unknown,
  userMessage: string,
): ValidatedAction | null {
  if (rawToolArgs == null) return null
  return validateProposedAction(persistedState, rawToolArgs, { userMessage })
}

export async function incrementAiUsageAfterReply(
  supabase: SupabaseClient,
  usedBefore: number,
  limit: number,
  bonusBefore: number,
): Promise<{ ok: true; usage: AiUsageSnapshot } | { ok: false; status: number; error: string }> {
  const useIncludedMonthly = usedBefore < limit

  if (useIncludedMonthly) {
    const { data: incData, error: incErr } = await supabase.rpc('increment_ai_monthly_usage')

    if (incErr) {
      return { ok: false, status: 500, error: `Kunne ikke oppdatere bruk: ${incErr.message}` }
    }

    const inc = incData as { message_count?: number } | null
    const usedAfter =
      typeof inc?.message_count === 'number' ? inc.message_count : usedBefore + 1

    return {
      ok: true,
      usage: { used: usedAfter, limit, bonusCredits: bonusBefore },
    }
  }

  const { data: decData, error: decErr } = await supabase.rpc('decrement_ai_bonus_credit')

  if (decErr) {
    return { ok: false, status: 500, error: `Kunne ikke oppdatere bruk: ${decErr.message}` }
  }

  const dec = decData as { credits_remaining?: number } | null
  const bonusAfter =
    typeof dec?.credits_remaining === 'number' ? dec.credits_remaining : bonusBefore - 1

  return {
    ok: true,
    usage: { used: usedBefore, limit, bonusCredits: bonusAfter },
  }
}
