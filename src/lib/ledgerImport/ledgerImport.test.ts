import { describe, expect, it } from 'vitest'
import { buildTransactionsFromLedgerLines } from '@/lib/ledgerImport/buildTransactionsFromLedger'
import {
  extractLeadingNumberAccount,
  parseLedgerCsvText,
  normalizeLedgerAccountCode,
} from '@/lib/ledgerImport/parseLedgerCsv'
import { rollupLedgerLinesByAccount } from '@/lib/ledgerImport/ledgerAccountRollup'
import { CONTA_HOVEDBOK_PROFILE } from '@/lib/ledgerImport/profiles/conta'
import { GENERIC_LEDGER_PROFILE } from '@/lib/ledgerImport/profiles/generic'
import type { CanonicalLedgerLine, LedgerCsvProfile } from '@/lib/ledgerImport/types'
import {
  countPotentialDuplicateLedgerLines,
  summarizeLedgerLinesForPreview,
} from '@/lib/ledgerImport/summarizeLedgerImport'
import type { BudgetCategory } from '@/lib/store'

const profile: LedgerCsvProfile = { ...GENERIC_LEDGER_PROFILE, sourceId: 'generic', id: 'test' }

const csvDebitCredit = `Dato;Konto;Kontonavn;Bilag;Tekst;Debet;Kredit
15.01.2026;4000;Salgsinntekt;1;Faktura A;;5000
15.01.2026;7140;Kontor;1;Papir;200;`

const csvContaHovedbok = `Konto;Bilag;Dato;Beskrivelse;Mva-kode;Spesifikasjon;Prosjekt;Avdeling;Beløp (NOK)
1500 Kundefordring;;01.03.2026;Inngående saldo;0;;;;109,47
4000 Salgsinntekt;mar.26;10.03.2026;Faktura rad;0;;;;5000,50
3000 Annen;apr.26;11.03.2026;Post;0;;;;-250,25
8060 Finansposter;mai.26;15.03.2026;Små finans;0;;;;0,45`

describe('rollupLedgerLinesByAccount', () => {
  it('summerer inntekt og utgift per konto og teller linjer', () => {
    const lines: CanonicalLedgerLine[] = [
      {
        fileLine: 2,
        dateIso: '2026-03-01',
        accountCode: '3010',
        accountName: 'Test',
        voucherRef: '1',
        description: 'A',
        amount: 100.5,
        ledgerSide: 'expense',
      },
      {
        fileLine: 3,
        dateIso: '2026-03-02',
        accountCode: '3010',
        accountName: 'Test',
        voucherRef: '2',
        description: 'B',
        amount: 50.25,
        ledgerSide: 'income',
      },
      {
        fileLine: 4,
        dateIso: '2026-03-03',
        accountCode: '4000',
        accountName: 'Salg',
        voucherRef: '',
        description: 'C',
        amount: 200,
        ledgerSide: 'income',
      },
    ]
    const m = rollupLedgerLinesByAccount(lines)
    const a = m.get('3010')
    expect(a?.count).toBe(2)
    expect(a?.sumExpense).toBe(100.5)
    expect(a?.sumIncome).toBe(50.25)
    expect(m.get('4000')?.sumIncome).toBe(200)
    expect(m.get('4000')?.sumExpense).toBe(0)
  })
})

describe('conta_hovedbok_v1', () => {
  it('parser Beløp (NOK), splitter konto/navn og dropper konto under 3000', () => {
    const r = parseLedgerCsvText(csvContaHovedbok, CONTA_HOVEDBOK_PROFILE)
    expect(r.rowErrors.length).toBe(0)
    expect(r.lines.length).toBe(3)
    const dropped = r.lines.find((l) => l.accountCode === '1500')
    expect(dropped).toBeUndefined()
    const sales = r.lines.find((l) => l.accountCode === '4000')
    expect(sales?.accountName).toBe('Salgsinntekt')
    expect(sales?.amount).toBe(5000.5)
    expect(sales?.ledgerSide).toBe('income')
    expect(sales?.description).toBe('Faktura rad')
    const other = r.lines.find((l) => l.accountCode === '3000')
    expect(other?.amount).toBe(250.25)
    expect(other?.ledgerSide).toBe('expense')
    const fin = r.lines.find((l) => l.accountCode === '8060')
    expect(fin?.amount).toBe(0.45)
    expect(fin?.ledgerSide).toBe('income')
  })

  it('parser ikke debet/kredit-hovedbok med Conta-profil', () => {
    const r = parseLedgerCsvText(csvDebitCredit, CONTA_HOVEDBOK_PROFILE)
    expect(r.lines.length).toBe(0)
    expect(r.rowErrors.some((e) => e.detail?.includes('beløpkolonne'))).toBe(true)
  })
})

describe('minAccountNumberInclusive (generisk profil)', () => {
  it('filerer ikke når min ikke er satt', () => {
    const csv = `Dato;Konto;Beløp
10.02.2026;1920;-150,50
10.02.2026;3000;8000`
    const p: LedgerCsvProfile = {
      ...profile,
      amountModel: 'singleSigned',
      headers: { ...profile.headers, debit: undefined, credit: undefined, amount: ['belop', 'beløp'] },
      singleSignedExpenseIsNegative: true,
    }
    const r = parseLedgerCsvText(csv, p)
    expect(r.lines.some((l) => l.accountCode === '1920')).toBe(true)
    expect(r.lines.some((l) => l.accountCode === '3000')).toBe(true)
  })

  it('hopper over rader under min når satt', () => {
    const csv = `Dato;Konto;Beløp
10.02.2026;1920;-150,50
10.02.2026;3000;8000`
    const p: LedgerCsvProfile = {
      ...profile,
      amountModel: 'singleSigned',
      headers: { ...profile.headers, debit: undefined, credit: undefined, amount: ['belop', 'beløp'] },
      singleSignedExpenseIsNegative: true,
      minAccountNumberInclusive: 3000,
    }
    const r = parseLedgerCsvText(csv, p)
    expect(r.lines.length).toBe(1)
    expect(r.lines[0]?.accountCode).toBe('3000')
  })
})

describe('parseLedgerCsvText', () => {
  it('tolererer tomme linjer før overskrift', () => {
    const csv = `\n\nDato;Konto;Kontonavn;Bilag;Tekst;Debet;Kredit\n15.01.2026;7140;Kontor;1;Papir;200;\n`
    const r = parseLedgerCsvText(csv, profile)
    expect(r.rowErrors.filter((e) => e.reason === 'invalid_date')).toHaveLength(0)
    expect(r.lines.length).toBe(1)
    expect(r.lines[0]?.accountCode).toBe('7140')
    expect(r.lines[0]?.amount).toBe(200)
  })

  it('parser debet/kredit og setter ledgerSide', () => {
    const r = parseLedgerCsvText(csvDebitCredit, profile)
    expect(r.rowErrors.length).toBe(0)
    expect(r.lines.length).toBe(2)
    const sales = r.lines.find((l) => l.accountCode === '4000')
    const office = r.lines.find((l) => l.accountCode === '7140')
    expect(sales?.ledgerSide).toBe('income')
    expect(sales?.amount).toBe(5000)
    expect(office?.ledgerSide).toBe('expense')
    expect(office?.amount).toBe(200)
  })

  it('avviser rad med både debet og kredit', () => {
    const bad = `Dato;Konto;Kontonavn;Bilag;Tekst;Debet;Kredit
15.01.2026;4000;X;1;Y;100;200`
    const r = parseLedgerCsvText(bad, profile)
    expect(r.lines.length).toBe(0)
    expect(r.rowErrors.some((e) => e.reason === 'ambiguous_amount')).toBe(true)
  })

  it('hopper stille over rader med konto/beløp men uten dato (IB/UB-lignende)', () => {
    const csv = `Dato;Konto;Kontonavn;Bilag;Tekst;Debet;Kredit
;4000;Salgsinntekt;;Inngående balanse;;5000
15.01.2026;7140;Kontor;1;Papir;200;`
    const r = parseLedgerCsvText(csv, profile)
    expect(r.lines.length).toBe(1)
    expect(r.lines[0]?.accountCode).toBe('7140')
    expect(r.rowErrors.filter((e) => e.reason === 'invalid_date')).toHaveLength(0)
  })

  it('når både Bilagsdato og Dato finnes: bruker Dato — tom Dato selv om Bilagsdato er fylt', () => {
    const csv = `Konto;Bilag;Bilagsdato;Dato;Kontonavn;Tekst;Debet;Kredit
4000;x;15.01.2026;;Salgsinntekt;IB-linje;;5000
7140;y;15.01.2026;16.01.2026;Kontor;Post;100;`
    const r = parseLedgerCsvText(csv, profile)
    expect(r.lines.length).toBe(1)
    expect(r.lines[0]?.accountCode).toBe('7140')
    expect(r.lines.some((l) => l.accountCode === '4000')).toBe(false)
  })

  it('fil uten Dato-kolonne: faller tilbake til Bilagsdato', () => {
    const csv = `Konto;Bilag;Bilagsdato;Kontonavn;Tekst;Debet;Kredit
7140;y;16.01.2026;Kontor;Post;100;`
    const r = parseLedgerCsvText(csv, profile)
    expect(r.lines.length).toBe(1)
    expect(r.lines[0]?.dateIso).toBe('2026-01-16')
  })

  it('tomt bilag: linje i heldBackLines, ikke i lines', () => {
    const csv = `Dato;Konto;Kontonavn;Bilag;Tekst;Debet;Kredit
15.01.2026;4000;Salg;;Uten bilag;;1000
15.01.2026;7140;Kontor;1;Med bilag;50;`
    const r = parseLedgerCsvText(csv, profile)
    expect(r.lines.length).toBe(1)
    expect(r.lines[0]?.accountCode).toBe('7140')
    expect(r.heldBackLines.length).toBe(1)
    expect(r.heldBackLines[0]?.line.accountCode).toBe('4000')
    expect(r.heldBackLines[0]?.reason).toBe('empty_voucher')
  })

  it('bilag bare plassholder (-): held back', () => {
    const csv = `Dato;Konto;Kontonavn;Bilag;Tekst;Debet;Kredit
15.01.2026;4000;Salg;-;X;;1000`
    const r = parseLedgerCsvText(csv, profile)
    expect(r.lines.length).toBe(0)
    expect(r.heldBackLines.length).toBe(1)
    expect(r.heldBackLines[0]?.line.accountCode).toBe('4000')
  })

  it('ingen bilagskolonne i fil: ingen voucher-filter, heldBack tom', () => {
    const p: LedgerCsvProfile = {
      ...profile,
      headers: { ...profile.headers, voucherRef: ['ingen_slik_kolonne'] },
    }
    const csv = `Dato;Konto;Kontonavn;Tekst;Debet;Kredit
15.01.2026;7140;Kontor;Papir;200;`
    const r = parseLedgerCsvText(csv, p)
    expect(r.heldBackLines.length).toBe(0)
    expect(r.lines.length).toBe(1)
    expect(r.lines[0]?.accountCode).toBe('7140')
  })
})

describe('singleSigned profile', () => {
  const signedProfile: LedgerCsvProfile = {
    ...profile,
    amountModel: 'singleSigned',
    headers: {
      ...profile.headers,
      debit: undefined,
      credit: undefined,
      amount: ['belop', 'beløp'],
    },
  }

  it('tolker negative som utgift når singleSignedExpenseIsNegative', () => {
    const csv = `Dato;Konto;Beløp
10.02.2026;1920;-150,50
10.02.2026;3000;8000`
    const r = parseLedgerCsvText(csv, { ...signedProfile, singleSignedExpenseIsNegative: true })
    expect(r.rowErrors.length).toBe(0)
    const bank = r.lines.find((l) => l.accountCode === '1920')
    const inc = r.lines.find((l) => l.accountCode === '3000')
    expect(bank?.amount).toBe(151)
    expect(bank?.ledgerSide).toBe('expense')
    expect(inc?.amount).toBe(8000)
    expect(inc?.ledgerSide).toBe('income')
  })
})

describe('normalizeLedgerAccountCode', () => {
  it('fjerner mellomrom', () => {
    expect(normalizeLedgerAccountCode('1 920')).toBe('1920')
  })
})

describe('extractLeadingNumberAccount', () => {
  it('tar ledende siffer og rest som navn', () => {
    expect(extractLeadingNumberAccount('1500 Kundefordring')).toEqual({
      code: '1500',
      nameFromCell: 'Kundefordring',
    })
  })
})

describe('buildTransactionsFromLedgerLines', () => {
  const cats: BudgetCategory[] = [
    {
      id: '1',
      name: 'Lønn',
      budgeted: Array(12).fill(0),
      spent: 0,
      type: 'income',
      color: '#000',
      parentCategory: 'inntekter',
      frequency: 'monthly',
    },
    {
      id: '2',
      name: 'Kontor',
      budgeted: Array(12).fill(0),
      spent: 0,
      type: 'expense',
      color: '#000',
      parentCategory: 'utgifter',
      frequency: 'monthly',
    },
  ]

  it('bruker kategoritype fra budsjett, ikke ledgerSide', () => {
    const lines = parseLedgerCsvText(csvDebitCredit, profile).lines
    const map = { '4000': 'Lønn', '7140': 'Kontor' }
    const { transactions, skippedUnmapped, skippedUnknownCategory, importedLineSnapshots } =
      buildTransactionsFromLedgerLines(lines, map, cats, 'p1', 'run-ledger-1')
    expect(skippedUnmapped).toBe(0)
    expect(skippedUnknownCategory).toBe(0)
    expect(transactions.length).toBe(2)
    expect(importedLineSnapshots.length).toBe(2)
    expect(importedLineSnapshots[0]).toMatchObject({
      fileLine: expect.any(Number),
      dateIso: expect.any(String),
      amount: expect.any(Number),
      accountCode: expect.any(String),
      categoryName: expect.any(String),
      type: expect.any(String),
    })
    expect(transactions.every((t) => t.ledgerImportRunId === 'run-ledger-1')).toBe(true)
    const tL = transactions.find((t) => t.category === 'Lønn')
    expect(tL?.type).toBe('income')
    expect(tL?.amount).toBe(5000)
    const tK = transactions.find((t) => t.category === 'Kontor')
    expect(tK?.type).toBe('expense')
  })
})

describe('summarizeLedgerLinesForPreview', () => {
  it('teller umappede linjer', () => {
    const lines = parseLedgerCsvText(csvDebitCredit, profile).lines
    const s = summarizeLedgerLinesForPreview(lines, { '4000': 'Lønn' })
    expect(s.unmappedLineCount).toBe(1)
    expect(s.lineCount).toBe(2)
  })
})

describe('countPotentialDuplicateLedgerLines', () => {
  it('matcher fingerprint som transaksjonsimport', () => {
    const lines = parseLedgerCsvText(csvDebitCredit, profile).lines
    const existing = [
      {
        date: '2026-01-15',
        amount: 5000,
        description: '1 — Faktura A — Salgsinntekt',
        category: 'Lønn',
      },
    ]
    const n = countPotentialDuplicateLedgerLines(
      lines,
      (acc) => ({ '4000': 'Lønn', '7140': 'Kontor' }[acc] ?? null),
      existing,
    )
    expect(n).toBeGreaterThanOrEqual(1)
  })
})
