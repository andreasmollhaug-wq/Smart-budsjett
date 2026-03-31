import { z } from 'zod'
const savingsFrequencySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(4),
  z.literal(12),
  z.literal(26),
  z.literal(52),
])

const compoundFrequencySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(4),
  z.literal(12),
  z.literal(26),
  z.literal(52),
])

export const formuebyggerInputSchema = z.object({
  startAmount: z.number().min(0),
  annualReturn: z.number().min(0).max(1),
  savingsPerPayment: z.number().min(0),
  savingsFrequency: savingsFrequencySchema,
  years: z.number().int().min(1).max(60),
  taxRate: z.number().min(0).max(1),
  inflation: z.number().min(0).max(1),
  compoundFrequency: compoundFrequencySchema,
})

export type FormuebyggerInputParsed = z.infer<typeof formuebyggerInputSchema>
