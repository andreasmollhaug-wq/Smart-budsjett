# Neonomics sandbox (DNB) i Dottir

Valgfri modul for bankimport via [Neonomics Account Data](https://docs.neonomics.io/docs/accounts-1) i sandbox. Når modulen er av, fungerer filimport (DNB xlsx, Sparebank 1, CSV-mal) som før.

## Aktivere lokalt

1. **Neonomics Developer Portal** (én gang)
   - App med **Account Data**
   - **Generate Key** → JSON-fil (f.eks. `b7ca6271-….json`) — lagre **utenfor Git**
   - **Redirect URLs:** `http://localhost:3000/api/bank/neonomics/callback` (+ ev. Vercel preview-URL)

2. **`.env.local`** (aldri commit) — se [`.env.example`](../.env.example) for alle `NEONOMICS_*` og `CRON_SECRET` (for planlagt bank-cron).

3. **Supabase:** kjør migrasjoner i Supabase (SQL Editor eller CLI):
   - [`031_bank_connections.sql`](../supabase/migrations/031_bank_connections.sql)
   - [`032_bank_connections_last_sync.sql`](../supabase/migrations/032_bank_connections_last_sync.sql)
   - [`033_bank_connections_multi_bank.sql`](../supabase/migrations/033_bank_connections_multi_bank.sql)
   - [`034_bank_sync_log.sql`](../supabase/migrations/034_bank_sync_log.sql)
   - [`035_bank_connection_accounts.sql`](../supabase/migrations/035_bank_connection_accounts.sql)

4. **`npm run dev`** — sett **alle tre** flagg til `true` i `.env.local`:
   - `NEONOMICS_ENABLED`
   - `NEXT_PUBLIC_NEONOMICS_ENABLED`
   - `NEXT_PUBLIC_NEONOMICS_UI_LIVE` — uten denne vises ikke «Koble til bank» i menyen (bevisst av på produksjon til lansering)

   Start dev-server på nytt etter endring av `NEXT_PUBLIC_*`-variabler.

5. **Helse-sjekk (valgfritt):** `GET /api/bank/neonomics/health` (innlogget miljø med flagg på).

## v1.6 — automatisk bank (Koble til bank)

- **Flere kontoer per profil (schema)** — bankvelger fylles **dynamisk** fra Neonomics `GET /ics/v3/banks?countryCode=NO` (sandbox: typisk DNB, Sbanken, Folio).
- **Popup-samtykke** — bank åpnes i eget vindu; hovedsiden viser overlay
- **Automatisk fra bank** — én bryter per kobling; styrer daglig cron ca. kl. 10 (UTC `0 9 * * *`, ~10:00 vinter / ~11:00 sommer i Oslo)
- **Server-side hent + import** — rader med lagret kartlegging importeres; ukjente lagres i `bankPendingNeonomics` i `user_app_state`
- **Bjellevarsler** — per profil + husholdningssammendrag (Familie) når andre profiler har ukartlagte rader
- **`bank_sync_log`** — logg per kjøring (cron/manuell)

### Manuell test v1.6

- [ ] Migrasjon 033–035 kjørt (035 = flere kontoer)
- [ ] Koble DNB via popup → samtykke OK
- [ ] **Hent transaksjoner** — importerte txs + ev. varsler om kartlegging
- [ ] Toggle **Automatisk hver dag** på/av
- [ ] `GET /api/cron/bank-neonomics` med `Authorization: Bearer $CRON_SECRET` (lokalt)
- [ ] Familie 2 profiler — husholdningsvarsel nevner riktig profilnavn
- [ ] Dedup ved ny henting

### Flere kontoer (DNB sandbox)

- [ ] Etter kobling: **Kontoer å hente fra** viser minst 2 kontoer (avhengig av sandbox-data)
- [ ] Standard: alle kontoer valgt → **Lagre kontovalg** (ved endring)
- [ ] **Oversikt per konto**: sist hentet, importert, venter kartlegging
- [ ] **Hent transaksjoner** oppdaterer alle valgte kontoer
- [ ] Avkryss bare én konto → ny henting gir bare rader fra den kontoen (sjekk liste under kartlegging)
- [ ] **Hent igjen** — ingen duplikater (`externalBankTxId` + konto)
- [ ] `GET /api/bank/neonomics/accounts?profileId=…&bankId=…` oppdaterer kontolisten

## Bruk i appen (E2E)

På `/konto/koble-til-bank` med aktiv profil og abonnement som tillater skriving:

- [ ] Menypunkt **Koble til bank** synlig under Min konto
- [ ] **?** ved siden av tittel åpner **Slik kobler du til bank** (steg-for-steg)
- [ ] Kort ingress under tittel; Sandbox-badge ved tittel (ikke på knapper)
- [ ] **Din bank** viser koblet status etter bank
- [ ] **Koble DNB** → popup → bank → test-personnummer `31125461118`
- [ ] Neste-steg-boks etter kobling: «Trykk Hent transaksjoner …»
- [ ] **Hent transaksjoner** / automatisk cron → kartlegging under **Importer transaksjoner** ved behov
- [ ] Map ukjente + ev. **KI-forslag** → **Importer**
- [ ] `/transaksjoner` — nye poster med riktig kategori
- [ ] **Hent igjen** — ingen duplikater (`externalBankTxId`)
- [ ] **Siste hentinger** under samme kort (ikke eget «Importer»-kapittel)
- [ ] Bytt profil — status og historikk filtreres
- [ ] `NEONOMICS_ENABLED=false` → menypunkt borte; DNB xlsx-import uendret

## Veikart etter v1.6

| Versjon | Innhold |
|---------|---------|
| **v2** | Produksjon (`api.neonomics.io`), ekte BankID (PSU i UI), samme dynamiske bankvelger |

## Feilkoder (sandbox)

| Kode | Typisk årsak |
|------|----------------|
| 1047 | Feil `x-psu-id` / encryption key (`key[0].keyData.rawValue`) |
| 1426 | Consent ikke fullført — fullfør bank på nytt |
| 1002 | Mangler `fromDate` på transaksjoner (skal håndteres i server-kode) |

## Slå av modulen

1. `NEONOMICS_ENABLED=false`, `NEXT_PUBLIC_NEONOMICS_ENABLED=false` og `NEXT_PUBLIC_NEONOMICS_UI_LIVE=false` (eller utelatt)
2. Deploy — UI og API returnerer 404 for Neonomics-ruter
3. Importerte transaksjoner og filimport påvirkes ikke

## Kodeplassering

| Område | Sti |
|--------|-----|
| Bibliotek | [`src/lib/neonomics/`](../src/lib/neonomics/) |
| Auto-import | [`src/lib/neonomics/bankAutoImportServer.ts`](../src/lib/neonomics/bankAutoImportServer.ts) |
| Varsler | [`src/lib/bankNotifications.ts`](../src/lib/bankNotifications.ts) |
| API | [`src/app/api/bank/neonomics/`](../src/app/api/bank/neonomics/) |
| Cron | [`src/app/api/cron/bank-neonomics/route.ts`](../src/app/api/cron/bank-neonomics/route.ts) |
| UI | [`src/components/konto/neonomics/`](../src/components/konto/neonomics/) + [`bankConnectCopy.ts`](../src/lib/neonomics/bankConnectCopy.ts) |
| Koble bank | [`src/app/(app)/konto/koble-til-bank/page.tsx`](../src/app/(app)/konto/koble-til-bank/page.tsx) |
| Kartlegging/import | [`src/app/(app)/konto/importer-transaksjoner/page.tsx`](../src/app/(app)/konto/importer-transaksjoner/page.tsx) |

Gjenbruker eksisterende bankimport-pipeline: `BankParsedRow` → kartlegging → `/api/bank-import-suggest` → `buildTransactionsFromBankRows` → persist via `applyBankImportToPersistedSlice` (server) eller `addBankImportRunWithTransactions` (klient).
