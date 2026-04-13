import type { ElementType } from 'react'
import type { Debt } from '@/lib/store'
import { CreditCard, Home, Car, AlertCircle, GraduationCap, Wallet, RefreshCw } from 'lucide-react'

export const debtTypeLabels: Record<Debt['type'], string> = {
  mortgage: 'Boliglån',
  loan: 'Lån',
  consumer_loan: 'Forbrukslån',
  refinancing: 'Refinansiering',
  student_loan: 'Studielån',
  credit_card: 'Kredittkort',
  other: 'Annet',
}

export const debtIcons: Record<Debt['type'], ElementType> = {
  mortgage: Home,
  loan: Car,
  consumer_loan: Wallet,
  refinancing: RefreshCw,
  student_loan: GraduationCap,
  credit_card: CreditCard,
  other: AlertCircle,
}

export const debtColors: Record<Debt['type'], string> = {
  mortgage: '#3B5BDB',
  loan: '#4C6EF5',
  consumer_loan: '#7950F2',
  refinancing: '#0CA678',
  student_loan: '#5C7CFA',
  credit_card: '#E03131',
  other: '#F08C00',
}
