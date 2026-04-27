/** Normaliser varenavn til sammenligningsnøkkel (norsk tegn forenklet). */
export function normalizeIngredientKey(name: string): string {
  let s = name.trim().toLowerCase()
  s = s.replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/å/g, 'a')
  s = s.normalize('NFD').replace(/\p{M}/gu, '')
  return s.replace(/\s+/g, ' ')
}
