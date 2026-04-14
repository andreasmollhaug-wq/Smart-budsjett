import type { RenovationChecklistItem, RenovationTemplateKey } from '../types'
import { BATHROOM_CHECKLIST_LABELS } from './bathroom'
import { KITCHEN_CHECKLIST_LABELS } from './kitchen'
import { generateId } from '@/lib/utils'

export function buildChecklistFromTemplate(
  templateKey: RenovationTemplateKey,
  makeId: () => string = generateId,
): RenovationChecklistItem[] {
  const labels =
    templateKey === 'bathroom'
      ? BATHROOM_CHECKLIST_LABELS
      : templateKey === 'kitchen'
        ? KITCHEN_CHECKLIST_LABELS
        : []
  return labels.map((label, order) => ({
    id: makeId(),
    label,
    done: false,
    order,
  }))
}
