'use client'
import { useState } from 'react'
import Header from '@/components/layout/Header'
import { useActivePersonFinance, SavingsGoal } from '@/lib/store'
import { formatNOK, calcProgress, generateId } from '@/lib/utils'
import { Plus, Trash2, Target, Calendar } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

const COLORS = ['#3B5BDB', '#0CA678', '#F08C00', '#AE3EC9', '#E03131', '#0B7285']

export default function SparingPage() {
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, removeSavingsGoal } = useActivePersonFinance()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', targetAmount: '', currentAmount: '', targetDate: '' })
  const [depositId, setDepositId] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState('')

  const totalSaved = savingsGoals.reduce((a, b) => a + b.currentAmount, 0)
  const totalTarget = savingsGoals.reduce((a, b) => a + b.targetAmount, 0)

  const handleAdd = () => {
    if (!form.name || !form.targetAmount) return
    addSavingsGoal({
      id: generateId(),
      name: form.name,
      targetAmount: Number(form.targetAmount),
      currentAmount: Number(form.currentAmount) || 0,
      targetDate: form.targetDate,
      color: COLORS[savingsGoals.length % COLORS.length],
    })
    setForm({ name: '', targetAmount: '', currentAmount: '', targetDate: '' })
    setShowForm(false)
  }

  const handleDeposit = (id: string) => {
    const goal = savingsGoals.find(g => g.id === id)
    if (!goal || !depositAmount) return
    updateSavingsGoal(id, { currentAmount: goal.currentAmount + Number(depositAmount) })
    setDepositId(null)
    setDepositAmount('')
  }

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'var(--bg)' }}>
      <Header title="Sparing" subtitle="Følg opp sparemålene dine" />
      <div className="p-8 space-y-6">

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Totalt spart</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--primary)' }}>{formatNOK(totalSaved)}</p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Totalt mål</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text)' }}>{formatNOK(totalTarget)}</p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Samlet fremgang</p>
            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--success)' }}>
              {Math.round(calcProgress(totalSaved, totalTarget))}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savingsGoals.map((goal) => {
            const pct = calcProgress(goal.currentAmount, goal.targetAmount)
            const remaining = goal.targetAmount - goal.currentAmount
            const radialData = [{ value: pct, fill: goal.color }]
            const daysLeft = goal.targetDate
              ? Math.max(0, Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000))
              : null

            return (
              <div key={goal.id} className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold" style={{ color: 'var(--text)' }}>{goal.name}</h3>
                    {goal.targetDate && (
                      <div className="flex items-center gap-1 mt-1">
                        <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {daysLeft} dager igjen
                        </span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => removeSavingsGoal(goal.id)}>
                    <Trash2 size={14} style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div style={{ width: 80, height: 80 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%"
                        data={radialData} startAngle={90} endAngle={-270}>
                        <RadialBar dataKey="value" cornerRadius={4} background={{ fill: '#E0E7FF' }} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{Math.round(pct)}%</p>
                    <p className="text-sm" style={{ color: 'var(--success)' }}>{formatNOK(goal.currentAmount)}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>av {formatNOK(goal.targetAmount)}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                    Mangler: <strong>{formatNOK(Math.max(0, remaining))}</strong>
                  </p>
                  {depositId === goal.id ? (
                    <div className="flex gap-2">
                      <input type="number" placeholder="Beløp" value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="flex-1 px-2 py-1.5 rounded-lg text-sm"
                        style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                      <button onClick={() => handleDeposit(goal.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                        style={{ background: goal.color }}>
                        Sett inn
                      </button>
                      <button onClick={() => setDepositId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs"
                        style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        Avbryt
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDepositId(goal.id)}
                      className="w-full py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{ background: 'var(--primary-pale)', color: 'var(--primary)' }}>
                      + Sett inn penger
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          <button onClick={() => setShowForm(true)}
            className="rounded-2xl p-5 flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-colors min-h-[200px]"
            style={{ borderColor: 'var(--accent)', color: 'var(--text-muted)' }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--primary-pale)' }}>
              <Plus size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <span className="text-sm font-medium">Nytt sparemål</span>
          </button>
        </div>

        {showForm && (
          <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Target size={16} style={{ color: 'var(--primary)' }} />
              Nytt sparemål
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Navn på mål" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
              <input placeholder="Målbeløp (NOK)" type="number" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
              <input placeholder="Startet med (NOK)" type="number" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
              <input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleAdd} className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: 'var(--primary)' }}>
                Opprett mål
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                Avbryt
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
