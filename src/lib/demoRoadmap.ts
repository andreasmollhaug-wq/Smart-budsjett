/** Eksempel-forslag på roadmap når demodata er på (ikke i databasen). */
export const DEMO_ROADMAP_ID_PREFIX = 'demo-rm-' as const

export type DemoFeatureRequestRow = {
  id: string
  title: string
  body: string | null
  /** Demodata bruker ikke Storage; alltid null for demo-synlige kort. */
  image_path: string | null
  status: 'pending' | 'approved' | 'in_progress' | 'done' | 'rejected'
  vote_count: number
  created_by: string
  created_at: string
}

export const DEMO_FEATURE_REQUESTS: DemoFeatureRequestRow[] = [
  {
    id: `${DEMO_ROADMAP_ID_PREFIX}1`,
    title: 'Eksport av transaksjoner til CSV',
    body: 'Ønsker å kunne laste ned alle transaksjoner for et år som regneark.',
    image_path: null,
    status: 'pending',
    vote_count: 12,
    created_by: '00000000-0000-0000-0000-000000000001',
    created_at: '2025-01-15T10:00:00.000Z',
  },
  {
    id: `${DEMO_ROADMAP_ID_PREFIX}2`,
    title: 'Gjentakende transaksjoner',
    body: 'Husleie og abonnement som kommer tilbake hver måned uten å legge inn på nytt.',
    image_path: null,
    status: 'approved',
    vote_count: 28,
    created_by: '00000000-0000-0000-0000-000000000001',
    created_at: '2025-02-01T14:30:00.000Z',
  },
  {
    id: `${DEMO_ROADMAP_ID_PREFIX}3`,
    title: 'Mørk modus',
    body: 'Valgfritt mørkt tema i hele appen.',
    image_path: null,
    status: 'in_progress',
    vote_count: 41,
    created_by: '00000000-0000-0000-0000-000000000001',
    created_at: '2024-11-20T09:15:00.000Z',
  },
  {
    id: `${DEMO_ROADMAP_ID_PREFIX}4`,
    title: 'Bankintegrasjon (les kun)',
    body: 'Synkroniser kontoutdrag sikkert — lesemodus først.',
    image_path: null,
    status: 'done',
    vote_count: 52,
    created_by: '00000000-0000-0000-0000-000000000001',
    created_at: '2024-08-10T16:45:00.000Z',
  },
  {
    id: `${DEMO_ROADMAP_ID_PREFIX}5`,
    title: 'Gamle idé som ikke passet',
    body: 'Eksempel på avvist forslag i demo.',
    image_path: null,
    status: 'rejected',
    vote_count: 3,
    created_by: '00000000-0000-0000-0000-000000000001',
    created_at: '2024-06-01T12:00:00.000Z',
  },
]

export function isDemoRoadmapId(id: string): boolean {
  return id.startsWith(DEMO_ROADMAP_ID_PREFIX)
}
