import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const out = join(__dirname, '../src/features/matHandleliste/classicGroceries.ts')

const items = []
function add(name, cat, price, aliases) {
  items.push({ name, cat, price, aliases: aliases?.length ? aliases : undefined })
}

const gronn = [
  ['Potet', 22, ['poteter', 'potatis']],
  ['Gulrot', 18, ['gulrøtter']],
  ['Løk', 15, ['kepaløk']],
  ['Hvitløk', 28],
  ['Purre', 24],
  ['Sellerirot', 20],
  ['Pastinakk', 22],
  ['Kålrot', 16],
  ['Rotkål', 19],
  ['Rosenkål', 32],
  ['Blomkål', 35],
  ['Brokkoli', 38],
  ['Spinat', 29],
  ['Isbergsalat', 25],
  ['Ruccola', 32],
  ['Tomat', 34],
  ['Cherrytomat', 42],
  ['Agurk', 18],
  ['Paprika', 28],
  ['Chili', 35],
  ['Squash', 22],
  ['Aubergine', 26],
  ['Søtpotet', 24],
  ['Eple', 32],
  ['Pære', 34],
  ['Banan', 22],
  ['Appelsin', 28],
  ['Kiwi', 35],
  ['Sitron', 12],
  ['Lime', 15],
  ['Avokado', 22],
  ['Druer', 45],
  ['Jordbær', 48],
  ['Blåbær', 55],
  ['Bringebær', 52],
  ['Melon', 38],
  ['Ananas', 42],
  ['Mango', 28],
  ['Granateple', 35],
  ['Fersken', 38],
  ['Nektarin', 36],
  ['Plomme', 32],
  ['Nepe', 14],
  ['Reddik', 16],
  ['Ingefær', 22],
  ['Champignon', 35],
  ['Shiitake', 48],
  ['Mais', 18],
  ['Asparges', 58],
  ['Bønnespirer', 15],
  ['Kinakål', 24],
  ['Endive', 28],
  ['Fennikel', 32],
  ['Persille', 18],
  ['Dill', 20],
  ['Koriander', 22],
  ['Basilikum fersk', 28],
  ['Mynte', 24],
  ['Salat mix', 26],
  ['Snackgulrot', 22],
  ['Cherry paprika', 38],
  ['Mini agurk', 24],
  ['Vårløk', 18],
  ['Sjalottløk', 28],
  ['Beter', 20],
  ['Knutekål', 26],
  ['Pak choi', 22],
  ['Snackselleri', 20],
  ['Granateepler', 35],
  ['Pasjonsfrukt', 42],
  ['Klementin', 32],
  ['Grapefrukt', 28],
  ['Sopp portobello', 42],
]
gronn.forEach(([n, p, a]) => add(n, 'gronn', p, a))

const meieri = [
  ['Helmelk', 22],
  ['Lettmelk', 21],
  ['H-melk', 23],
  ['Kulturmelk', 20],
  ['Lettrømme', 18],
  ['Seterrømme', 24],
  ['Crème fraîche', 32],
  ['Kremfløte', 38],
  ['Matfløte', 28],
  ['Smør', 45],
  ['Meierismør', 48],
  ['Margarin', 35],
  ['Egg M', 42],
  ['Egg L', 48],
  ['Yoghurt naturell', 28],
  ['Yoghurt skogsbær', 32],
  ['Yoghurt vanilje', 30],
  ['Skyr', 35],
  ['Kesam', 32],
  ['Cottage cheese', 38],
  ['Rømme', 22],
  ['Mozzarella', 42],
  ['Norvegia', 115],
  ['Jarlsberg', 125],
  ['Ridder', 118],
  ['Fetaost', 48],
  ['Parmesan', 68],
  ['Chèvre', 52],
  ['Brie', 88],
  ['Camembert', 82],
  ['Gouda', 98],
  ['Edamer', 92],
  ['Pecorino', 72],
  ['Mascarpone', 45],
  ['Ricotta', 38],
  ['Filmjölk', 26],
  ['Kefir', 32],
  ['Smøreost', 35],
  ['Philadelphia', 42],
  ['Brunost', 185],
]
meieri.forEach(([n, p]) => add(n, 'meieri', p))

const kjott = [
  ['Kyllingfilet', 89],
  ['Kyllinglår', 65],
  ['Kyllingvinger', 58],
  ['Kalkunfilet', 95],
  ['Svinekotelett', 112],
  ['Svinefilet', 125],
  ['Svinebiff', 118],
  ['Bacon', 48],
  ['Røkt skinke', 38],
  ['Kokt skinke', 42],
  ['Kjøttdeig storfe', 95],
  ['Kjøttdeig svin', 78],
  ['Kjøttdeig kylling', 82],
  ['Kjøttpølser', 45],
  ['Grillpølser', 48],
  ['Medisterkake', 52],
  ['Karbonadedeig', 88],
  ['Lammekotelett', 145],
  ['Oksestek', 185],
  ['Biff culotte', 195],
  ['Reinsdyrkaker', 68],
  ['Laks hel', 220],
  ['Laks skiver', 185],
  ['Ørret', 175],
  ['Torsk', 165],
  ['Sei', 142],
  ['Kolje', 138],
  ['Makrell', 48],
  ['Sild', 38],
  ['Reker', 125],
  ['Tunfisk boks', 28],
  ['Blåskjell', 45],
  ['Blekkfisk', 88],
  ['Wienerpølse', 42],
  ['Kyllingpølser', 45],
  ['Fiskepinner', 52],
  ['Fiskekaker', 48],
  ['Fiskeboller', 45],
  ['Røkt laks', 165],
  ['Gravet laks', 175],
  ['Kaviar', 48],
]
kjott.forEach(([n, p]) => add(n, 'kjott', p))

const torr = `Brød,Finbrød,Grovbrød,Rundstykker,Baguette,Ciabatta,Knekkebrød,Knäckebröd,Havregryn,Havregryn glutenfri,Müsli,Cornflakes,Ris jasmine,Ris basmati,Ris fullkorn,Pastaskruer,Spaghetti,Tagliatelle,Makaroni,Lasagneplater,Couscous,Bulgur,Quinoa,Grønne linser,Røde linser,Kikerter boks,Bønner hvite boks,Soltørkede tomater,Mel hvete,Mel sammalt,Mel mandel,Bakepulver,Gjær tørr,Sukker,Sukker farin,Salt hav,Salt bordsalt,Pepper sort,Paprikapulver,Kanel,Kardemomme,Laubærblad,Oregano tørr,Basilikum tørr,Timian,Rosmarin,Curry,Garam masala,Chiliflak,Olivenolje,Rapsolje,Sesamolje,Soyasaus,Worcestersaus,Fish sauce,Sriracha,Ketchup,Sennep,Dijonsennep,Majones,Buljong terning,Tomatpuré,Passata,Hermetiske tomater,Bønner i tomatsaus,Kidneyboks,Baconbiter boks,Oliven grønne,Oliven sorte,Kapers,Sylteagurk,Syltet rødløk,Honning,Sirup lønnesirup,Sukkersirup,Syltetøy bringebær,Syltetøy jordbær,Nutella,Peanøttsmør,Mandler,Rosiner,Soltørka aprikos,Fiken tørr,Dadler,Kokosflak,Kakaopulver,Bakekakosjokolade,Vaniljesukker,Puddingpulver,Gelatin,Vaffelrøre,Croutonger,Brødsmuler,Panko,Risnudler,Eggnudler,Instantnudler,Popcorn kern,Taco skjell,Tortilla,Tacokrydder,Chili con carne boks,Surdeigsstarter,Smultringmix,Knekkebrød rug`.split(',')
torr.forEach((n, i) => add(n, 'torr', 12 + (i % 18) * 3))

const fryse = [
  ['Erter frost', 28],
  ['Spinat frost', 32],
  ['Brokkoli frost', 35],
  ['Wokblanding frost', 38],
  ['Grønnsaksblanding', 36],
  ['Fiskegrateng', 68],
  ['Fiskepinner frost', 52],
  ['Pizza Grandiosa', 48],
  ['Pizza fryst', 55],
  ['Vaniljeis', 65],
  ['Sjokoladeis', 68],
  ['Is pinne', 42],
  ['Frosne bær', 45],
  ['Pommes frites', 38],
  ['Hash browns', 42],
  ['Lapskaus', 58],
  ['Lasagne frost', 72],
  ['Kjøttboller frost', 62],
  ['Kylling nuggets', 55],
  ['Vårruller', 48],
]
fryse.forEach(([n, p]) => add(n, 'fryse', p))

const drikke = [
  ['Kaffe filter', 85],
  ['Kaffe espresso', 95],
  ['Te sort', 48],
  ['Te grønn', 52],
  ['Te kamille', 45],
  ['Saft solbær', 38],
  ['Saft appelsin', 36],
  ['Brus cola', 32],
  ['Brus appelsin', 32],
  ['Mineralvann kullsyre', 22],
  ['Mineralvann naturell', 20],
  ['Eplejuice', 38],
  ['Appelsinjuice', 36],
  ['Smoothie flaske', 42],
  ['Iskaffe flaske', 45],
  ['Chai latte klar', 38],
  ['Kakao pulver', 48],
  ['Energy drink', 22],
  ['Vitaminvann', 28],
  ['Kokosvann', 32],
]
drikke.forEach(([n, p]) => add(n, 'drikke', p))

const annet = [
  ['Tørkerull', 35],
  ['Bakepapir', 28],
  ['Aluminiumsfolie', 42],
  ['Plastfolie', 38],
  ['Ziplock poser', 32],
  ['Søppelposer', 45],
  ['Oppvaskmiddel', 38],
  ['Håndsåpe', 32],
  ['Tannpasta', 42],
  ['Skuresvamp', 18],
  ['Isposer', 15],
  ['Telys', 28],
  ['Fyrstikker', 22],
  ['Batteri AA', 48],
  ['Rengjøringsspray', 42],
  ['Tørkepapir', 38],
  ['Skuremiddel', 35],
  ['Glassrengjøring', 32],
  ['Tøymykner', 55],
  ['Vaskepulver', 68],
]
annet.forEach(([n, p]) => add(n, 'annet', p))

const header = `/**
 * Klassiske norske dagligvarer med veiledende testpriser (NOK per enhet).
 * Kun demo / inntil API — ikke markedspriser.
 * Generert av scripts/generateClassicGroceries.mjs
 */
import { normalizeIngredientKey } from './ingredientKey'

export interface ClassicGroceryEntry {
  displayName: string
  categoryId: 'gronn' | 'meieri' | 'kjott' | 'torr' | 'fryse' | 'drikke' | 'annet'
  unitPriceNok: number
  searchAliases?: string[]
}

`

const body = `export const CLASSIC_GROCERIES: ClassicGroceryEntry[] = ${JSON.stringify(
  items.map((x) => {
    const o = { displayName: x.name, categoryId: x.cat, unitPriceNok: x.price }
    if (x.aliases) o.searchAliases = x.aliases
    return o
  }),
  null,
  2,
)}

const byNorm = new Map<string, ClassicGroceryEntry>()

for (const e of CLASSIC_GROCERIES) {
  const keys = [e.displayName, ...(e.searchAliases ?? [])]
  for (const k of keys) {
    const n = normalizeIngredientKey(k)
    if (n && !byNorm.has(n)) byNorm.set(n, e)
  }
}

/** Første treff på normalisert nøkkel (navn eller alias). */
export function lookupClassicByNormalizedKey(normalizedKey: string): ClassicGroceryEntry | null {
  return byNorm.get(normalizedKey) ?? null
}

/** Filtrer katalog for søkestreng (navn, alias eller kategori-label sjekkes i UI). */
export function filterClassicGroceries(query: string, limit = 80): ClassicGroceryEntry[] {
  const q = normalizeIngredientKey(query)
  if (!q) return CLASSIC_GROCERIES.slice(0, limit)
  const out: ClassicGroceryEntry[] = []
  for (const e of CLASSIC_GROCERIES) {
    if (out.length >= limit) break
    const hay = normalizeIngredientKey(
      [e.displayName, ...(e.searchAliases ?? [])].join(' '),
    )
    if (hay.includes(q) || normalizeIngredientKey(e.displayName).includes(q)) out.push(e)
  }
  return out
}
`

writeFileSync(out, header + body, 'utf8')
console.log('Wrote', out, 'count', items.length)
