import type { RoutineCategory, RoutinePreset } from './routinePresetTypes'

export const ROUTINE_CATEGORIES: RoutineCategory[] = [
  { id: 'hjem', titleNo: 'Hjem og hus', descriptionNo: 'Rydding og vedlikehold', sortOrder: 1 },
  { id: 'trening', titleNo: 'Trening og helse', descriptionNo: 'Bevegelse og kropp', sortOrder: 2 },
  { id: 'okonomi_hus', titleNo: 'Økonomi og plan', sortOrder: 3 },
  { id: 'personlig', titleNo: 'Personlig', descriptionNo: 'Mental hygiene og rutiner', sortOrder: 4 },
  { id: 'digital', titleNo: 'Digital', sortOrder: 5 },
  { id: 'sosial', titleNo: 'Sosial og relasjoner', sortOrder: 6 },
]

export const ROUTINE_PRESETS: RoutinePreset[] = [
  /* Hjem */
  {
    id: 'preset_vaske_bad',
    categoryId: 'hjem',
    name: 'Vaske badet',
    kind: 'weekly',
    note: 'Rengjøringsrutine på bad',
    tags: ['bad', 'vask', 'vaskerom', 'rene'],
  },
  {
    id: 'preset_rydde_tommeko',
    categoryId: 'hjem',
    name: 'Rydde og tømme papirkurver',
    kind: 'weekly',
    tags: ['søppel', 'papirkurv', 'rydde', 'avfall'],
  },
  {
    id: 'preset_lufte',
    categoryId: 'hjem',
    name: 'Lufte ut boligen',
    kind: 'daily',
    tags: ['frisk luft', 'vinduer', 'luft'],
  },
  {
    id: 'preset_stovsuge',
    categoryId: 'hjem',
    name: 'Støvsuge eller mopp',
    kind: 'weekly',
    tags: ['støvsuger', 'gulv', 'rene'],
  },
  {
    id: 'preset_brett_seng',
    categoryId: 'hjem',
    name: 'Brette senga',
    kind: 'daily',
    tags: ['søvn', 'soverom', 'morgen'],
  },
  {
    id: 'preset_klesvask',
    categoryId: 'hjem',
    name: 'Klesvask',
    kind: 'weekly',
    tags: ['vask', 'skittentøy', 'maskin'],
  },
  {
    id: 'preset_kjokkenskuffer',
    categoryId: 'hjem',
    name: 'Ordne kjøkkenskap',
    kind: 'monthly',
    note: 'Sortere eller tørke kjøkkenskap',
    tags: ['kjøken', 'oppbevaring', 'mat'],
  },

  /* Trening */
  {
    id: 'preset_gaatur',
    categoryId: 'trening',
    name: 'Gåtur eller bevegelse',
    kind: 'daily',
    targetDays: 20,
    tags: ['går', 'gå', 'sko', 'utendørs', 'fresh luft'],
  },
  {
    id: 'preset_styrketrening',
    categoryId: 'trening',
    name: 'Styrketrening',
    kind: 'weekly',
    tags: ['løfte', 'gym', 'vekt', 'muskler'],
  },
  {
    id: 'preset_oppvarming',
    categoryId: 'trening',
    name: 'Oppvarming / strekk',
    kind: 'weekly',
    tags: ['stretch', 'yoga', 'fleksibel'],
  },
  {
    id: 'preset_drikke_vann_train',
    categoryId: 'trening',
    name: 'Drikke nok vann',
    kind: 'daily',
    tags: ['væske', 'hydrering', 'trent'],
  },

  /* Økonomi og plan */
  {
    id: 'preset_utlegg',
    categoryId: 'okonomi_hus',
    name: 'Legge inn utlegg',
    kind: 'weekly',
    tags: ['regnskap', 'kvittering', 'smart budsjett', 'budjett'],
  },
  {
    id: 'preset_sjekk_budsjett',
    categoryId: 'okonomi_hus',
    name: 'Sjekke budsjettet',
    kind: 'weekly',
    tags: ['penger', 'økonomi', 'oversikt'],
  },
  {
    id: 'preset_abonnement',
    categoryId: 'okonomi_hus',
    name: 'Gå gjennom abonnementspriser',
    kind: 'monthly',
    tags: ['abonnement', 'spare', 'kostnader'],
  },
  {
    id: 'preset_sette_malen',
    categoryId: 'okonomi_hus',
    name: 'Vurdere sparing / mål',
    kind: 'monthly',
    tags: ['spare', 'måned', 'spar'],
  },

  /* Personlig */
  {
    id: 'preset_meditasjon',
    categoryId: 'personlig',
    name: 'Meditere eller pause',
    kind: 'daily',
    targetDays: 14,
    tags: ['ro', 'mental', 'stress', 'mind'],
  },
  {
    id: 'preset_dagbok',
    categoryId: 'personlig',
    name: 'Skrive litt i dagbok',
    kind: 'weekly',
    tags: ['reflektere', 'tenke', 'notat'],
  },
  {
    id: 'preset_les_barne',
    categoryId: 'personlig',
    name: 'Lese litt for seg selv',
    kind: 'weekly',
    tags: ['bok', 'læring', 'avslappende'],
  },
  {
    id: 'preset_mobil_pause',
    categoryId: 'personlig',
    name: 'Tid uten skjerm før søvn',
    kind: 'daily',
    targetDays: 25,
    tags: ['sov', 'digital detox', 'natt'],
  },
  {
    id: 'preset_plan_dagen',
    categoryId: 'personlig',
    name: 'Planlegge eller prioritere dag',
    kind: 'daily',
    tags: ['todo', 'oversikt', 'morgen'],
  },

  /* Digital */
  {
    id: 'preset_backup',
    categoryId: 'digital',
    name: 'Ta sikkerhetskopi eller sjekke lagring',
    kind: 'monthly',
    tags: ['backup', 'foto', 'sky'],
  },
  {
    id: 'preset_oppdater',
    categoryId: 'digital',
    name: 'Rydde apper eller oppdatering',
    kind: 'weekly',
    tags: ['telefon', 'oppdater'],
  },
  {
    id: 'preset_mail',
    categoryId: 'digital',
    name: 'Ordne eller rydde e-post',
    kind: 'weekly',
    tags: ['innboks', 'mail'],
  },
  {
    id: 'preset_passord',
    categoryId: 'digital',
    name: 'Trinn for passordsikkerhet',
    kind: 'monthly',
    note: 'Sjekke viktige konti',
    tags: ['sikkerhet', '2fa', 'pasord'],
  },

  /* Sosial */
  {
    id: 'preset_ringe_familie',
    categoryId: 'sosial',
    name: 'Ringe eller skrive til familie',
    kind: 'weekly',
    tags: ['familie', 'mor', 'far', 'nær'],
  },
  {
    id: 'preset_tid_partner',
    categoryId: 'sosial',
    name: 'Kvalitetstid med ektefelle eller partner',
    kind: 'weekly',
    tags: ['forhold', 'par', 'dato'],
  },
  {
    id: 'preset_vennskapskontakt',
    categoryId: 'sosial',
    name: 'Ta kontakt med en venn',
    kind: 'weekly',
    tags: ['venn', 'meld'],
  },
]
