/** Felles kundetekst for husholdning vs. innlogging (Familie-plan, sikkerhet). */
export const householdSingleLoginNote =
  'I dag deler hele husholdningen én innlogging (én e-post og ett passord). Egne innlogginger per person kommer på sikt.'

export const mfaRecommendIntro =
  'Vi anbefaler tofaktorautentisering for ekstra beskyttelse av kontoen din. Det er valgfritt — du kan bruke Dottir uten.'

export const mfaRecommendShort =
  'Vi anbefaler tofaktorautentisering for ekstra beskyttelse. Det er valgfritt — du kan slå det på under Min konto → Sikkerhet når du er innlogget.'

export const mfaRecommendAfterSignup =
  'Tips: Når du er innlogget kan du slå på anbefalt tofaktor under Min konto → Sikkerhet.'

export const mfaLostDeviceNote =
  'Mister du tilgang til autentiseringsappen, kontakt oss for hjelp med gjenoppretting:'

export const mfaHowToIntro =
  'Det tar omtrent 1–2 minutter. Du trenger en gratis autentiseringsapp — det er valgfritt, men anbefalt.'

export const mfaHowToMobileSteps = [
  'Trykk «Aktiver 2FA» og deretter «Kopier nøkkel».',
  'Åpne autentiseringsappen (Google Authenticator, 1Password, Authy …) og velg «Legg til manuelt» / «Enter setup key».',
  'Lim inn nøkkelen, lagre, og skriv den 6-sifrede koden tilbake i Dottir.',
] as const

export const mfaHowToDesktopSteps = [
  'Trykk «Aktiver 2FA» på denne siden.',
  'Skann QR-koden med autentiseringsappen på telefonen din.',
  'Skriv den 6-sifrede koden tilbake her for å bekrefte.',
] as const

export const mfaHowToLoginSteps = [
  'Logg inn med e-post og passord som vanlig.',
  'Skriv 6-sifret kode fra autentiseringsappen.',
] as const

export const mfaRecommendedApps = [
  'Google Authenticator',
  'Microsoft Authenticator',
  '1Password',
  'Bitwarden / Authy',
] as const

export const mfaHowToMobileQrNote =
  'Du kan ikke skanne QR-kode på samme telefon — kopier nøkkelen i stedet. Det er helt normalt.'

/** Kort steg under aktiv aktivering (detaljer i «Slik gjør du det»-modal). */
export const mfaEnrollMobileSteps = [
  'Kopier nøkkelen under.',
  'Lim inn i autentiseringsappen og lagre.',
  'Skriv 6-sifrede koden tilbake her.',
] as const
