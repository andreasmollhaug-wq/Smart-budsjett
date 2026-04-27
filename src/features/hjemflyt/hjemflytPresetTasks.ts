/** Brukervendte kategorier for forslagsbiblioteket (statisk i kode). */
export const HJEMFLYT_PRESET_CATEGORIES = [
  'Kjøkken og mat',
  'Rom og rydding',
  'Bad og toalett',
  'Klesvask og garderobe',
  'Dyr',
  'Utendørs og søppel',
  'Handle og ærend',
  'Fellesarealer',
  'Lett vedlikehold',
] as const

export type HjemflytPresetCategory = (typeof HJEMFLYT_PRESET_CATEGORIES)[number]

export type HjemflytPresetTask = {
  presetKey: string
  title: string
  category: HjemflytPresetCategory
}

/** Ca. 50 vanlige husoppgaver på norsk; stabil `presetKey` for tester og fremtidig i18n. */
export const HJEMFLYT_PRESET_TASKS: readonly HjemflytPresetTask[] = [
  { presetKey: 'kitchen_dishes', title: 'Ta oppvasken', category: 'Kjøkken og mat' },
  { presetKey: 'kitchen_dishwasher_empty', title: 'Tømme oppvaskmaskinen', category: 'Kjøkken og mat' },
  { presetKey: 'kitchen_dishwasher_load', title: 'Fylle oppvaskmaskinen', category: 'Kjøkken og mat' },
  { presetKey: 'kitchen_wipe_table', title: 'Tørke av spisebordet', category: 'Kjøkken og mat' },
  { presetKey: 'kitchen_counters', title: 'Rense kjøkkenbenken', category: 'Kjøkken og mat' },
  { presetKey: 'kitchen_floor_sweep', title: 'Feie kjøkkengulvet', category: 'Kjøkken og mat' },
  { presetKey: 'kitchen_bins_small', title: 'Tømme liten søppelbøtte på kjøkken', category: 'Kjøkken og mat' },
  { presetKey: 'kitchen_table_set', title: 'Dekke på til middag', category: 'Kjøkken og mat' },
  { presetKey: 'kitchen_table_clear', title: 'Rydde av bordet etter middag', category: 'Kjøkken og mat' },
  { presetKey: 'room_tidy', title: 'Rydde på rommet', category: 'Rom og rydding' },
  { presetKey: 'room_bed', title: 'Re opp senga', category: 'Rom og rydding' },
  { presetKey: 'room_dust', title: 'Tørke støv på rommet', category: 'Rom og rydding' },
  { presetKey: 'room_vacuum_own', title: 'Støvsuge eget rom', category: 'Rom og rydding' },
  { presetKey: 'room_laundry_basket', title: 'Legge skittentøy i kurven', category: 'Rom og rydding' },
  { presetKey: 'room_toys', title: 'Rydde leker', category: 'Rom og rydding' },
  { presetKey: 'backpack_pack', title: 'Pakke skolesekk og sjekke lekser', category: 'Rom og rydding' },
  { presetKey: 'bath_wipe', title: 'Tørke av vask og benk på badet', category: 'Bad og toalett' },
  { presetKey: 'bath_toilet', title: 'Rengjøre toalettet', category: 'Bad og toalett' },
  { presetKey: 'bath_mirror', title: 'Pusse speil på badet', category: 'Bad og toalett' },
  { presetKey: 'bath_towels', title: 'Bytte håndkle', category: 'Bad og toalett' },
  { presetKey: 'laundry_hang', title: 'Henge opp vått tøy', category: 'Klesvask og garderobe' },
  { presetKey: 'laundry_fold', title: 'Brette rent tøy', category: 'Klesvask og garderobe' },
  { presetKey: 'laundry_machine', title: 'Legge inn vaskemaskin', category: 'Klesvask og garderobe' },
  { presetKey: 'laundry_put_away', title: 'Legge rent tøy på plass', category: 'Klesvask og garderobe' },
  { presetKey: 'pet_dog_walk', title: 'Gå tur med hunden', category: 'Dyr' },
  { presetKey: 'pet_feed', title: 'Fôre dyrene', category: 'Dyr' },
  { presetKey: 'pet_water', title: 'Fylle vannskål', category: 'Dyr' },
  { presetKey: 'pet_litter', title: 'Rydde eller bytte kattesand', category: 'Dyr' },
  { presetKey: 'pet_poop_bag', title: 'Plukke opp etter hunden', category: 'Dyr' },
  { presetKey: 'outdoor_trash_bins', title: 'Sette ut søppeldunker', category: 'Utendørs og søppel' },
  { presetKey: 'outdoor_bins_in', title: 'Ta inn tømte dunker', category: 'Utendørs og søppel' },
  { presetKey: 'outdoor_mail', title: 'Hente post', category: 'Utendørs og søppel' },
  { presetKey: 'outdoor_snow', title: 'Måke eller feie ved inngang', category: 'Utendørs og søppel' },
  { presetKey: 'outdoor_walkway', title: 'Rydde gangsti / oppkjørsel', category: 'Utendørs og søppel' },
  { presetKey: 'outdoor_recycling', title: 'Bære resirkulering til bod', category: 'Utendørs og søppel' },
  { presetKey: 'shop_groceries', title: 'Handle dagligvarer', category: 'Handle og ærend' },
  { presetKey: 'shop_pharmacy', title: 'Hente noe på apoteket', category: 'Handle og ærend' },
  { presetKey: 'shop_birthday', title: 'Kjøpe inn til bursdag', category: 'Handle og ærend' },
  { presetKey: 'shop_mail_errand', title: 'Post eller annet lite ærend', category: 'Handle og ærend' },
  { presetKey: 'common_vacuum_living', title: 'Støvsuge stua', category: 'Fellesarealer' },
  { presetKey: 'common_dust_shelves', title: 'Tørke støv på hyller i fellesrom', category: 'Fellesarealer' },
  { presetKey: 'common_hallway', title: 'Rydde og feie gangen', category: 'Fellesarealer' },
  { presetKey: 'common_stairs', title: 'Tørke eller feie trapper', category: 'Fellesarealer' },
  { presetKey: 'common_windowsill', title: 'Tørke vinduskarmer', category: 'Fellesarealer' },
  { presetKey: 'common_shoes', title: 'Rydde sko og yttertøy i gangen', category: 'Fellesarealer' },
  { presetKey: 'maintain_plants_water', title: 'Vanne blomster og planter', category: 'Lett vedlikehold' },
  { presetKey: 'maintain_herbs', title: 'Vanne urter på kjøkkenet', category: 'Lett vedlikehold' },
  { presetKey: 'maintain_light_bulb', title: 'Bytte lyspære som er gått', category: 'Lett vedlikehold' },
  { presetKey: 'maintain_car_scrape', title: 'Skrape bilruter (vinter)', category: 'Lett vedlikehold' },
  { presetKey: 'maintain_papers_sort', title: 'Sortere papirer og post', category: 'Lett vedlikehold' },
] as const satisfies readonly HjemflytPresetTask[]

export function presetsGroupedByCategory(): { category: HjemflytPresetCategory; tasks: readonly HjemflytPresetTask[] }[] {
  const map = new Map<HjemflytPresetCategory, HjemflytPresetTask[]>()
  for (const c of HJEMFLYT_PRESET_CATEGORIES) map.set(c, [])
  for (const t of HJEMFLYT_PRESET_TASKS) {
    const list = map.get(t.category)
    if (list) list.push(t)
  }
  return HJEMFLYT_PRESET_CATEGORIES.map((category) => ({
    category,
    tasks: map.get(category) ?? [],
  })).filter((g) => g.tasks.length > 0)
}

export function normalizeHjemflytTaskTitleForDedupe(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function hjemflytTaskTitleExists(title: string, existing: { title: string }[]): boolean {
  const n = normalizeHjemflytTaskTitleForDedupe(title)
  return existing.some((t) => normalizeHjemflytTaskTitleForDedupe(t.title) === n)
}
