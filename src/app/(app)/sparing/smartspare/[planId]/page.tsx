'use client'

import { useParams } from 'next/navigation'
import SmartSparePlanDetail from '@/components/sparing/SmartSparePlanDetail'

export default function SmartSparePlanRoutePage() {
  const params = useParams()
  const planId = typeof params.planId === 'string' ? params.planId : ''
  if (!planId) return null
  return <SmartSparePlanDetail planId={planId} />
}
