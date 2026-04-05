'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import SavingsGoalsReportDocument from '@/components/reports/SavingsGoalsReportDocument'
import { buildSavingsReportData } from '@/lib/savingsReportData'
import { exportBankReportPdf } from '@/lib/exportBankReportPdf'
import { useActivePersonFinance } from '@/lib/store'
import { ChevronLeft, FileDown, Printer } from 'lucide-react'

export default function RapportSparemalPage() {
  const {
    transactions,
    budgetCategories,
    savingsGoals,
    activeProfileId,
    profiles,
    isHouseholdAggregate,
  } = useActivePersonFinance()

  const [generatedAt, setGeneratedAt] = useState(() => new Date())
  const [pdfLoading, setPdfLoading] = useState(false)

  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.dataset.printReport = 'true'
    return () => {
      delete document.body.dataset.printReport
    }
  }, [])

  const scopeLabel = useMemo(() => {
    if (isHouseholdAggregate) return 'Husholdning (alle profiler)'
    const name = profiles.find((p) => p.id === activeProfileId)?.name
    return name ?? 'Profil'
  }, [isHouseholdAggregate, profiles, activeProfileId])

  const reportData = useMemo(
    () => buildSavingsReportData(savingsGoals, transactions, budgetCategories, activeProfileId),
    [savingsGoals, transactions, budgetCategories, activeProfileId],
  )

  const handlePrint = () => {
    setGeneratedAt(new Date())
    requestAnimationFrame(() => {
      window.print()
    })
  }

  const handlePdf = useCallback(async () => {
    const el = reportRef.current
    if (!el) return
    setPdfLoading(true)
    setGeneratedAt(new Date())
    try {
      await new Promise((r) => requestAnimationFrame(r))
      const key = new Date().toISOString().slice(0, 10)
      await exportBankReportPdf(el, `sparemalrapport-${key}.pdf`)
    } finally {
      setPdfLoading(false)
    }
  }, [])

  const hasGoals = savingsGoals.length > 0

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <div className="print-hidden">
        <Header title="Sparemålrapport" subtitle="Oversikt, fremdrift og aktivitet for dine sparemål" />
        <div
          className="px-8 py-4 flex flex-wrap items-center gap-3 border-b"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <Link
            href="/rapporter"
            className="inline-flex items-center gap-1 text-sm font-medium"
            style={{ color: 'var(--primary)' }}
          >
            <ChevronLeft size={16} />
            Rapporter
          </Link>
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handlePrint}
              disabled={!hasGoals}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <Printer size={16} />
              Skriv ut
            </button>
            <button
              type="button"
              onClick={handlePdf}
              disabled={pdfLoading || !hasGoals}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-60"
              style={{ background: 'var(--primary)' }}
            >
              <FileDown size={16} />
              {pdfLoading ? 'Genererer PDF…' : 'Eksporter til PDF'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {!hasGoals ? (
          <div
            className="max-w-lg mx-auto rounded-2xl p-8 text-center print-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Du har ingen sparemål ennå. Opprett mål på sparesiden for å få en rapport her.
            </p>
            <Link
              href="/sparing"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-medium text-white"
              style={{ background: 'var(--primary)' }}
            >
              Gå til sparing
            </Link>
          </div>
        ) : (
          <SavingsGoalsReportDocument
            ref={reportRef}
            generatedAt={generatedAt}
            scopeLabel={scopeLabel}
            data={reportData}
          />
        )}
      </div>
    </div>
  )
}
