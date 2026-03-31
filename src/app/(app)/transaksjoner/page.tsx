'use client'
import { useState } from 'react'
import Header from '@/components/layout/Header'
import { useActivePersonFinance, Transaction } from '@/lib/store'
import { formatNOK, generateId } from '@/lib/utils'
import { Plus, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export default function TransaksjonerPage() {
  const { transactions, budgetCategories, addTransaction, removeTransaction, recalcBudgetSpent } = useActivePersonFinance()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    category: '',
  })

  const expenseCategories = budgetCategories.filter((c) => c.type === 'expense')
  const incomeCategories = budgetCategories.filter((c) => c.type === 'income')
  const allCats = [...expenseCategories, ...incomeCategories]

  const selectedCat = allCats.find((c) => c.name === form.category)
  const txType = selectedCat?.type || 'expense'

  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthlyTx = transactions.filter((t) => t.date.startsWith(thisMonth)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const monthlyIncome = monthlyTx.filter((t) => t.type === 'income').reduce((a, b) => a + b.amount, 0)
  const monthlyExpense = monthlyTx.filter((t) => t.type === 'expense').reduce((a, b) => a + b.amount, 0)

  const handleAdd = () => {
    if (!form.description || !form.amount || !form.category) return
    const newTx: Transaction = {
      id: generateId(),
      date: form.date,
      description: form.description,
      amount: Number(form.amount),
      category: form.category,
      type: txType,
    }
    addTransaction(newTx)
    recalcBudgetSpent(form.category)
    setForm({
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: '',
      category: '',
    })
    setShowForm(false)
  }

  const handleDelete = (tx: Transaction) => {
    removeTransaction(tx.id)
    recalcBudgetSpent(tx.category)
  }

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header title="Transaksjoner" subtitle="Logg inntekter og utgifter" />
      <div className="p-8 space-y-6">

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Inntekt denne måneden', value: formatNOK(monthlyIncome), color: 'var(--success)', icon: ArrowUpRight },
            { label: 'Utgifter denne måneden', value: formatNOK(monthlyExpense), color: 'var(--danger)', icon: ArrowDownLeft },
            { label: 'Netto denne måneden', value: formatNOK(monthlyIncome - monthlyExpense), color: monthlyIncome - monthlyExpense >= 0 ? 'var(--success)' : 'var(--danger)', icon: monthlyIncome - monthlyExpense >= 0 ? ArrowUpRight : ArrowDownLeft },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} style={{ color }} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {monthlyTx.length === 0 && !showForm ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Ingen transaksjoner registrert denne måneden</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: 'var(--primary)' }}
            >
              <Plus size={16} />
              Legg til transaksjon
            </button>
          </div>
        ) : (
          <>
            {showForm ? (
              <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Ny transaksjon</h2>
                <div className="grid grid-cols-4 gap-4">
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="px-3 py-2 rounded-xl text-sm"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  />
                  <input
                    placeholder="Beskrivelse"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="px-3 py-2 rounded-xl text-sm"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  />
                  <input
                    placeholder="Beløp (NOK)"
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="px-3 py-2 rounded-xl text-sm"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  />
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="px-3 py-2 rounded-xl text-sm"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  >
                    <option value="">Velg kategori</option>
                    {allCats.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleAdd}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white"
                    style={{ background: 'var(--primary)' }}
                  >
                    Legg til
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--primary)' }}
              >
                <Plus size={16} />
                Legg til transaksjon
              </button>
            )}

            <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>Transaksjoner denne måneden</h2>
              <div className="space-y-2">
                {monthlyTx.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg)' }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            background: budgetCategories.find((c) => c.name === tx.category)?.color || 'var(--text-muted)',
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                            {tx.description}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {tx.category} • {tx.date}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: tx.type === 'income' ? 'var(--success)' : 'var(--danger)' }}
                      >
                        {tx.type === 'income' ? '+' : '-'}{formatNOK(tx.amount)}
                      </p>
                      <button onClick={() => handleDelete(tx)} className="p-1 rounded-lg transition-colors hover:opacity-70">
                        <Trash2 size={14} style={{ color: 'var(--text-muted)' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
