export type ServicePresetGroup = 'streaming' | 'musikk' | 'programvare' | 'trening' | 'nyheter' | 'annet'

export const SERVICE_SUBSCRIPTION_PRESETS: {
  group: ServicePresetGroup
  groupLabel: string
  items: { key: string; label: string }[]
}[] = [
  {
    group: 'streaming',
    groupLabel: 'Streaming',
    items: [
      { key: 'netflix', label: 'Netflix' },
      { key: 'hbo', label: 'HBO Max' },
      { key: 'disney', label: 'Disney+' },
      { key: 'viaplay', label: 'Viaplay' },
      { key: 'tv2play', label: 'TV 2 Play' },
      { key: 'appletv', label: 'Apple TV+' },
      { key: 'prime', label: 'Amazon Prime Video' },
    ],
  },
  {
    group: 'musikk',
    groupLabel: 'Musikk og podkast',
    items: [
      { key: 'spotify', label: 'Spotify' },
      { key: 'applemusic', label: 'Apple Music' },
      { key: 'youtubepremium', label: 'YouTube Premium' },
      { key: 'tidal', label: 'Tidal' },
    ],
  },
  {
    group: 'programvare',
    groupLabel: 'Programvare og sky',
    items: [
      { key: 'microsoft365', label: 'Microsoft 365' },
      { key: 'googleone', label: 'Google One' },
      { key: 'icloud', label: 'iCloud' },
      { key: 'dropbox', label: 'Dropbox' },
      { key: 'adobe', label: 'Adobe' },
      { key: 'chatgpt', label: 'ChatGPT Plus' },
    ],
  },
  {
    group: 'trening',
    groupLabel: 'Trening',
    items: [
      { key: 'sats', label: 'SATS' },
      { key: 'evo', label: 'Evo Fitness' },
      { key: 'trening_annet', label: 'Trening (annet)' },
    ],
  },
  {
    group: 'nyheter',
    groupLabel: 'Nyheter',
    items: [
      { key: 'aftenposten', label: 'Aftenposten+' },
      { key: 'dn', label: 'Dagens Næringsliv' },
    ],
  },
  {
    group: 'annet',
    groupLabel: 'Annet',
    items: [{ key: 'annet', label: 'Annet (fritekst)' }],
  },
]
