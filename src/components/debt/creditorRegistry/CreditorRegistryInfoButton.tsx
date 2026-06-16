'use client'

import InfoPopover from '@/components/ui/InfoPopover'

const INFO_TITLE = 'Oversikt gjeld'
const INFO_TEXT =
  'Registrer gjeld gruppert etter kreditor (f.eks. bank eller finansieringsselskap). Trykk på en kreditor for å se enkelte lån og subtotaler. Dette er et eget oversiktsverktøy og er ikke koblet til Gjeld → Oversikt, Snøball eller budsjettet ennå — tall her påvirker ikke andre moduler.'

export default function CreditorRegistryInfoButton() {
  return <InfoPopover title={INFO_TITLE} text={INFO_TEXT} align="end" />
}
