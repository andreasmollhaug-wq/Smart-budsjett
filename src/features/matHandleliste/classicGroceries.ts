/**
 * Klassiske norske dagligvarer med veiledende testpriser (typisk NOK per kg eller per liter, jf. butikkhyller).
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

export const CLASSIC_GROCERIES: ClassicGroceryEntry[] = [
  {
    "displayName": "Potet",
    "categoryId": "gronn",
    "unitPriceNok": 22,
    "searchAliases": [
      "poteter",
      "potatis"
    ]
  },
  {
    "displayName": "Gulrot",
    "categoryId": "gronn",
    "unitPriceNok": 18,
    "searchAliases": [
      "gulrøtter"
    ]
  },
  {
    "displayName": "Løk",
    "categoryId": "gronn",
    "unitPriceNok": 15,
    "searchAliases": [
      "kepaløk"
    ]
  },
  {
    "displayName": "Hvitløk",
    "categoryId": "gronn",
    "unitPriceNok": 28
  },
  {
    "displayName": "Purre",
    "categoryId": "gronn",
    "unitPriceNok": 24
  },
  {
    "displayName": "Sellerirot",
    "categoryId": "gronn",
    "unitPriceNok": 20
  },
  {
    "displayName": "Pastinakk",
    "categoryId": "gronn",
    "unitPriceNok": 22
  },
  {
    "displayName": "Kålrot",
    "categoryId": "gronn",
    "unitPriceNok": 16
  },
  {
    "displayName": "Rotkål",
    "categoryId": "gronn",
    "unitPriceNok": 19
  },
  {
    "displayName": "Rosenkål",
    "categoryId": "gronn",
    "unitPriceNok": 32
  },
  {
    "displayName": "Blomkål",
    "categoryId": "gronn",
    "unitPriceNok": 35
  },
  {
    "displayName": "Brokkoli",
    "categoryId": "gronn",
    "unitPriceNok": 38
  },
  {
    "displayName": "Spinat",
    "categoryId": "gronn",
    "unitPriceNok": 29
  },
  {
    "displayName": "Isbergsalat",
    "categoryId": "gronn",
    "unitPriceNok": 25
  },
  {
    "displayName": "Ruccola",
    "categoryId": "gronn",
    "unitPriceNok": 32
  },
  {
    "displayName": "Tomat",
    "categoryId": "gronn",
    "unitPriceNok": 34
  },
  {
    "displayName": "Cherrytomat",
    "categoryId": "gronn",
    "unitPriceNok": 42
  },
  {
    "displayName": "Agurk",
    "categoryId": "gronn",
    "unitPriceNok": 18
  },
  {
    "displayName": "Paprika",
    "categoryId": "gronn",
    "unitPriceNok": 28
  },
  {
    "displayName": "Chili",
    "categoryId": "gronn",
    "unitPriceNok": 35
  },
  {
    "displayName": "Squash",
    "categoryId": "gronn",
    "unitPriceNok": 22
  },
  {
    "displayName": "Aubergine",
    "categoryId": "gronn",
    "unitPriceNok": 26
  },
  {
    "displayName": "Søtpotet",
    "categoryId": "gronn",
    "unitPriceNok": 24
  },
  {
    "displayName": "Eple",
    "categoryId": "gronn",
    "unitPriceNok": 32
  },
  {
    "displayName": "Pære",
    "categoryId": "gronn",
    "unitPriceNok": 34
  },
  {
    "displayName": "Banan",
    "categoryId": "gronn",
    "unitPriceNok": 22
  },
  {
    "displayName": "Appelsin",
    "categoryId": "gronn",
    "unitPriceNok": 28
  },
  {
    "displayName": "Kiwi",
    "categoryId": "gronn",
    "unitPriceNok": 35
  },
  {
    "displayName": "Sitron",
    "categoryId": "gronn",
    "unitPriceNok": 12
  },
  {
    "displayName": "Lime",
    "categoryId": "gronn",
    "unitPriceNok": 15
  },
  {
    "displayName": "Avokado",
    "categoryId": "gronn",
    "unitPriceNok": 22
  },
  {
    "displayName": "Druer",
    "categoryId": "gronn",
    "unitPriceNok": 45
  },
  {
    "displayName": "Jordbær",
    "categoryId": "gronn",
    "unitPriceNok": 48
  },
  {
    "displayName": "Blåbær",
    "categoryId": "gronn",
    "unitPriceNok": 55
  },
  {
    "displayName": "Bringebær",
    "categoryId": "gronn",
    "unitPriceNok": 52
  },
  {
    "displayName": "Melon",
    "categoryId": "gronn",
    "unitPriceNok": 38
  },
  {
    "displayName": "Ananas",
    "categoryId": "gronn",
    "unitPriceNok": 42
  },
  {
    "displayName": "Mango",
    "categoryId": "gronn",
    "unitPriceNok": 28
  },
  {
    "displayName": "Granateple",
    "categoryId": "gronn",
    "unitPriceNok": 35
  },
  {
    "displayName": "Fersken",
    "categoryId": "gronn",
    "unitPriceNok": 38
  },
  {
    "displayName": "Nektarin",
    "categoryId": "gronn",
    "unitPriceNok": 36
  },
  {
    "displayName": "Plomme",
    "categoryId": "gronn",
    "unitPriceNok": 32
  },
  {
    "displayName": "Nepe",
    "categoryId": "gronn",
    "unitPriceNok": 14
  },
  {
    "displayName": "Reddik",
    "categoryId": "gronn",
    "unitPriceNok": 16
  },
  {
    "displayName": "Ingefær",
    "categoryId": "gronn",
    "unitPriceNok": 22
  },
  {
    "displayName": "Champignon",
    "categoryId": "gronn",
    "unitPriceNok": 35
  },
  {
    "displayName": "Shiitake",
    "categoryId": "gronn",
    "unitPriceNok": 48
  },
  {
    "displayName": "Mais",
    "categoryId": "gronn",
    "unitPriceNok": 18
  },
  {
    "displayName": "Asparges",
    "categoryId": "gronn",
    "unitPriceNok": 58
  },
  {
    "displayName": "Bønnespirer",
    "categoryId": "gronn",
    "unitPriceNok": 15
  },
  {
    "displayName": "Kinakål",
    "categoryId": "gronn",
    "unitPriceNok": 24
  },
  {
    "displayName": "Endive",
    "categoryId": "gronn",
    "unitPriceNok": 28
  },
  {
    "displayName": "Fennikel",
    "categoryId": "gronn",
    "unitPriceNok": 32
  },
  {
    "displayName": "Persille",
    "categoryId": "gronn",
    "unitPriceNok": 18
  },
  {
    "displayName": "Dill",
    "categoryId": "gronn",
    "unitPriceNok": 20
  },
  {
    "displayName": "Koriander",
    "categoryId": "gronn",
    "unitPriceNok": 22
  },
  {
    "displayName": "Basilikum fersk",
    "categoryId": "gronn",
    "unitPriceNok": 28
  },
  {
    "displayName": "Mynte",
    "categoryId": "gronn",
    "unitPriceNok": 24
  },
  {
    "displayName": "Salat mix",
    "categoryId": "gronn",
    "unitPriceNok": 26
  },
  {
    "displayName": "Snackgulrot",
    "categoryId": "gronn",
    "unitPriceNok": 22
  },
  {
    "displayName": "Cherry paprika",
    "categoryId": "gronn",
    "unitPriceNok": 38
  },
  {
    "displayName": "Mini agurk",
    "categoryId": "gronn",
    "unitPriceNok": 24
  },
  {
    "displayName": "Vårløk",
    "categoryId": "gronn",
    "unitPriceNok": 18
  },
  {
    "displayName": "Sjalottløk",
    "categoryId": "gronn",
    "unitPriceNok": 28
  },
  {
    "displayName": "Beter",
    "categoryId": "gronn",
    "unitPriceNok": 20
  },
  {
    "displayName": "Knutekål",
    "categoryId": "gronn",
    "unitPriceNok": 26
  },
  {
    "displayName": "Pak choi",
    "categoryId": "gronn",
    "unitPriceNok": 22
  },
  {
    "displayName": "Snackselleri",
    "categoryId": "gronn",
    "unitPriceNok": 20
  },
  {
    "displayName": "Granateepler",
    "categoryId": "gronn",
    "unitPriceNok": 35
  },
  {
    "displayName": "Pasjonsfrukt",
    "categoryId": "gronn",
    "unitPriceNok": 42
  },
  {
    "displayName": "Klementin",
    "categoryId": "gronn",
    "unitPriceNok": 32
  },
  {
    "displayName": "Grapefrukt",
    "categoryId": "gronn",
    "unitPriceNok": 28
  },
  {
    "displayName": "Sopp portobello",
    "categoryId": "gronn",
    "unitPriceNok": 42
  },
  {
    "displayName": "Helmelk",
    "categoryId": "meieri",
    "unitPriceNok": 22
  },
  {
    "displayName": "Lettmelk",
    "categoryId": "meieri",
    "unitPriceNok": 21
  },
  {
    "displayName": "H-melk",
    "categoryId": "meieri",
    "unitPriceNok": 23
  },
  {
    "displayName": "Kulturmelk",
    "categoryId": "meieri",
    "unitPriceNok": 20
  },
  {
    "displayName": "Lettrømme",
    "categoryId": "meieri",
    "unitPriceNok": 18
  },
  {
    "displayName": "Seterrømme",
    "categoryId": "meieri",
    "unitPriceNok": 24
  },
  {
    "displayName": "Crème fraîche",
    "categoryId": "meieri",
    "unitPriceNok": 32
  },
  {
    "displayName": "Kremfløte",
    "categoryId": "meieri",
    "unitPriceNok": 38
  },
  {
    "displayName": "Matfløte",
    "categoryId": "meieri",
    "unitPriceNok": 28
  },
  {
    "displayName": "Smør",
    "categoryId": "meieri",
    "unitPriceNok": 45
  },
  {
    "displayName": "Meierismør",
    "categoryId": "meieri",
    "unitPriceNok": 48
  },
  {
    "displayName": "Margarin",
    "categoryId": "meieri",
    "unitPriceNok": 35
  },
  {
    "displayName": "Egg M",
    "categoryId": "meieri",
    "unitPriceNok": 42
  },
  {
    "displayName": "Egg L",
    "categoryId": "meieri",
    "unitPriceNok": 48
  },
  {
    "displayName": "Yoghurt naturell",
    "categoryId": "meieri",
    "unitPriceNok": 28
  },
  {
    "displayName": "Yoghurt skogsbær",
    "categoryId": "meieri",
    "unitPriceNok": 32
  },
  {
    "displayName": "Yoghurt vanilje",
    "categoryId": "meieri",
    "unitPriceNok": 30
  },
  {
    "displayName": "Skyr",
    "categoryId": "meieri",
    "unitPriceNok": 35
  },
  {
    "displayName": "Kesam",
    "categoryId": "meieri",
    "unitPriceNok": 32
  },
  {
    "displayName": "Cottage cheese",
    "categoryId": "meieri",
    "unitPriceNok": 38
  },
  {
    "displayName": "Rømme",
    "categoryId": "meieri",
    "unitPriceNok": 22
  },
  {
    "displayName": "Mozzarella",
    "categoryId": "meieri",
    "unitPriceNok": 42
  },
  {
    "displayName": "Norvegia",
    "categoryId": "meieri",
    "unitPriceNok": 115
  },
  {
    "displayName": "Jarlsberg",
    "categoryId": "meieri",
    "unitPriceNok": 125
  },
  {
    "displayName": "Ridder",
    "categoryId": "meieri",
    "unitPriceNok": 118
  },
  {
    "displayName": "Fetaost",
    "categoryId": "meieri",
    "unitPriceNok": 48
  },
  {
    "displayName": "Parmesan",
    "categoryId": "meieri",
    "unitPriceNok": 68
  },
  {
    "displayName": "Chèvre",
    "categoryId": "meieri",
    "unitPriceNok": 52
  },
  {
    "displayName": "Brie",
    "categoryId": "meieri",
    "unitPriceNok": 88
  },
  {
    "displayName": "Camembert",
    "categoryId": "meieri",
    "unitPriceNok": 82
  },
  {
    "displayName": "Gouda",
    "categoryId": "meieri",
    "unitPriceNok": 98
  },
  {
    "displayName": "Edamer",
    "categoryId": "meieri",
    "unitPriceNok": 92
  },
  {
    "displayName": "Pecorino",
    "categoryId": "meieri",
    "unitPriceNok": 72
  },
  {
    "displayName": "Mascarpone",
    "categoryId": "meieri",
    "unitPriceNok": 45
  },
  {
    "displayName": "Ricotta",
    "categoryId": "meieri",
    "unitPriceNok": 38
  },
  {
    "displayName": "Filmjölk",
    "categoryId": "meieri",
    "unitPriceNok": 26
  },
  {
    "displayName": "Kefir",
    "categoryId": "meieri",
    "unitPriceNok": 32
  },
  {
    "displayName": "Smøreost",
    "categoryId": "meieri",
    "unitPriceNok": 35
  },
  {
    "displayName": "Philadelphia",
    "categoryId": "meieri",
    "unitPriceNok": 42
  },
  {
    "displayName": "Brunost",
    "categoryId": "meieri",
    "unitPriceNok": 185
  },
  {
    "displayName": "Kyllingfilet",
    "categoryId": "kjott",
    "unitPriceNok": 89
  },
  {
    "displayName": "Kyllinglår",
    "categoryId": "kjott",
    "unitPriceNok": 65
  },
  {
    "displayName": "Kyllingvinger",
    "categoryId": "kjott",
    "unitPriceNok": 58
  },
  {
    "displayName": "Kalkunfilet",
    "categoryId": "kjott",
    "unitPriceNok": 95
  },
  {
    "displayName": "Svinekotelett",
    "categoryId": "kjott",
    "unitPriceNok": 112
  },
  {
    "displayName": "Svinefilet",
    "categoryId": "kjott",
    "unitPriceNok": 125
  },
  {
    "displayName": "Svinebiff",
    "categoryId": "kjott",
    "unitPriceNok": 118
  },
  {
    "displayName": "Bacon",
    "categoryId": "kjott",
    "unitPriceNok": 48
  },
  {
    "displayName": "Røkt skinke",
    "categoryId": "kjott",
    "unitPriceNok": 38
  },
  {
    "displayName": "Kokt skinke",
    "categoryId": "kjott",
    "unitPriceNok": 42
  },
  {
    "displayName": "Kjøttdeig storfe",
    "categoryId": "kjott",
    "unitPriceNok": 95
  },
  {
    "displayName": "Kjøttdeig svin",
    "categoryId": "kjott",
    "unitPriceNok": 78
  },
  {
    "displayName": "Kjøttdeig kylling",
    "categoryId": "kjott",
    "unitPriceNok": 82
  },
  {
    "displayName": "Kjøttpølser",
    "categoryId": "kjott",
    "unitPriceNok": 45
  },
  {
    "displayName": "Grillpølser",
    "categoryId": "kjott",
    "unitPriceNok": 48
  },
  {
    "displayName": "Medisterkake",
    "categoryId": "kjott",
    "unitPriceNok": 52
  },
  {
    "displayName": "Karbonadedeig",
    "categoryId": "kjott",
    "unitPriceNok": 88
  },
  {
    "displayName": "Lammekotelett",
    "categoryId": "kjott",
    "unitPriceNok": 145
  },
  {
    "displayName": "Oksestek",
    "categoryId": "kjott",
    "unitPriceNok": 185
  },
  {
    "displayName": "Biff culotte",
    "categoryId": "kjott",
    "unitPriceNok": 195
  },
  {
    "displayName": "Reinsdyrkaker",
    "categoryId": "kjott",
    "unitPriceNok": 68
  },
  {
    "displayName": "Laks hel",
    "categoryId": "kjott",
    "unitPriceNok": 220
  },
  {
    "displayName": "Laks skiver",
    "categoryId": "kjott",
    "unitPriceNok": 185
  },
  {
    "displayName": "Ørret",
    "categoryId": "kjott",
    "unitPriceNok": 175
  },
  {
    "displayName": "Torsk",
    "categoryId": "kjott",
    "unitPriceNok": 165
  },
  {
    "displayName": "Sei",
    "categoryId": "kjott",
    "unitPriceNok": 142
  },
  {
    "displayName": "Kolje",
    "categoryId": "kjott",
    "unitPriceNok": 138
  },
  {
    "displayName": "Makrell",
    "categoryId": "kjott",
    "unitPriceNok": 48
  },
  {
    "displayName": "Sild",
    "categoryId": "kjott",
    "unitPriceNok": 38
  },
  {
    "displayName": "Reker",
    "categoryId": "kjott",
    "unitPriceNok": 125
  },
  {
    "displayName": "Tunfisk boks",
    "categoryId": "kjott",
    "unitPriceNok": 28
  },
  {
    "displayName": "Blåskjell",
    "categoryId": "kjott",
    "unitPriceNok": 45
  },
  {
    "displayName": "Blekkfisk",
    "categoryId": "kjott",
    "unitPriceNok": 88
  },
  {
    "displayName": "Wienerpølse",
    "categoryId": "kjott",
    "unitPriceNok": 42
  },
  {
    "displayName": "Kyllingpølser",
    "categoryId": "kjott",
    "unitPriceNok": 45
  },
  {
    "displayName": "Fiskepinner",
    "categoryId": "kjott",
    "unitPriceNok": 52
  },
  {
    "displayName": "Fiskekaker",
    "categoryId": "kjott",
    "unitPriceNok": 48
  },
  {
    "displayName": "Fiskeboller",
    "categoryId": "kjott",
    "unitPriceNok": 45
  },
  {
    "displayName": "Røkt laks",
    "categoryId": "kjott",
    "unitPriceNok": 165
  },
  {
    "displayName": "Gravet laks",
    "categoryId": "kjott",
    "unitPriceNok": 175
  },
  {
    "displayName": "Kaviar",
    "categoryId": "kjott",
    "unitPriceNok": 48
  },
  {
    "displayName": "Brød",
    "categoryId": "torr",
    "unitPriceNok": 12
  },
  {
    "displayName": "Finbrød",
    "categoryId": "torr",
    "unitPriceNok": 15
  },
  {
    "displayName": "Grovbrød",
    "categoryId": "torr",
    "unitPriceNok": 18
  },
  {
    "displayName": "Rundstykker",
    "categoryId": "torr",
    "unitPriceNok": 21
  },
  {
    "displayName": "Baguette",
    "categoryId": "torr",
    "unitPriceNok": 24
  },
  {
    "displayName": "Ciabatta",
    "categoryId": "torr",
    "unitPriceNok": 27
  },
  {
    "displayName": "Knekkebrød",
    "categoryId": "torr",
    "unitPriceNok": 30
  },
  {
    "displayName": "Knäckebröd",
    "categoryId": "torr",
    "unitPriceNok": 33
  },
  {
    "displayName": "Havregryn",
    "categoryId": "torr",
    "unitPriceNok": 36
  },
  {
    "displayName": "Havregryn glutenfri",
    "categoryId": "torr",
    "unitPriceNok": 39
  },
  {
    "displayName": "Müsli",
    "categoryId": "torr",
    "unitPriceNok": 42
  },
  {
    "displayName": "Cornflakes",
    "categoryId": "torr",
    "unitPriceNok": 45
  },
  {
    "displayName": "Ris jasmine",
    "categoryId": "torr",
    "unitPriceNok": 48
  },
  {
    "displayName": "Ris basmati",
    "categoryId": "torr",
    "unitPriceNok": 51
  },
  {
    "displayName": "Ris fullkorn",
    "categoryId": "torr",
    "unitPriceNok": 54
  },
  {
    "displayName": "Pastaskruer",
    "categoryId": "torr",
    "unitPriceNok": 57
  },
  {
    "displayName": "Spaghetti",
    "categoryId": "torr",
    "unitPriceNok": 60
  },
  {
    "displayName": "Tagliatelle",
    "categoryId": "torr",
    "unitPriceNok": 63
  },
  {
    "displayName": "Makaroni",
    "categoryId": "torr",
    "unitPriceNok": 12
  },
  {
    "displayName": "Lasagneplater",
    "categoryId": "torr",
    "unitPriceNok": 15
  },
  {
    "displayName": "Couscous",
    "categoryId": "torr",
    "unitPriceNok": 18
  },
  {
    "displayName": "Bulgur",
    "categoryId": "torr",
    "unitPriceNok": 21
  },
  {
    "displayName": "Quinoa",
    "categoryId": "torr",
    "unitPriceNok": 24
  },
  {
    "displayName": "Grønne linser",
    "categoryId": "torr",
    "unitPriceNok": 27
  },
  {
    "displayName": "Røde linser",
    "categoryId": "torr",
    "unitPriceNok": 30
  },
  {
    "displayName": "Kikerter boks",
    "categoryId": "torr",
    "unitPriceNok": 33
  },
  {
    "displayName": "Bønner hvite boks",
    "categoryId": "torr",
    "unitPriceNok": 36
  },
  {
    "displayName": "Soltørkede tomater",
    "categoryId": "torr",
    "unitPriceNok": 39
  },
  {
    "displayName": "Mel hvete",
    "categoryId": "torr",
    "unitPriceNok": 42
  },
  {
    "displayName": "Mel sammalt",
    "categoryId": "torr",
    "unitPriceNok": 45
  },
  {
    "displayName": "Mel mandel",
    "categoryId": "torr",
    "unitPriceNok": 48
  },
  {
    "displayName": "Bakepulver",
    "categoryId": "torr",
    "unitPriceNok": 51
  },
  {
    "displayName": "Gjær tørr",
    "categoryId": "torr",
    "unitPriceNok": 54
  },
  {
    "displayName": "Sukker",
    "categoryId": "torr",
    "unitPriceNok": 57
  },
  {
    "displayName": "Sukker farin",
    "categoryId": "torr",
    "unitPriceNok": 60
  },
  {
    "displayName": "Salt hav",
    "categoryId": "torr",
    "unitPriceNok": 63
  },
  {
    "displayName": "Salt bordsalt",
    "categoryId": "torr",
    "unitPriceNok": 12
  },
  {
    "displayName": "Pepper sort",
    "categoryId": "torr",
    "unitPriceNok": 15
  },
  {
    "displayName": "Paprikapulver",
    "categoryId": "torr",
    "unitPriceNok": 18
  },
  {
    "displayName": "Kanel",
    "categoryId": "torr",
    "unitPriceNok": 21
  },
  {
    "displayName": "Kardemomme",
    "categoryId": "torr",
    "unitPriceNok": 24
  },
  {
    "displayName": "Laubærblad",
    "categoryId": "torr",
    "unitPriceNok": 27
  },
  {
    "displayName": "Oregano tørr",
    "categoryId": "torr",
    "unitPriceNok": 30
  },
  {
    "displayName": "Basilikum tørr",
    "categoryId": "torr",
    "unitPriceNok": 33
  },
  {
    "displayName": "Timian",
    "categoryId": "torr",
    "unitPriceNok": 36
  },
  {
    "displayName": "Rosmarin",
    "categoryId": "torr",
    "unitPriceNok": 39
  },
  {
    "displayName": "Curry",
    "categoryId": "torr",
    "unitPriceNok": 42
  },
  {
    "displayName": "Garam masala",
    "categoryId": "torr",
    "unitPriceNok": 45
  },
  {
    "displayName": "Chiliflak",
    "categoryId": "torr",
    "unitPriceNok": 48
  },
  {
    "displayName": "Olivenolje",
    "categoryId": "torr",
    "unitPriceNok": 51
  },
  {
    "displayName": "Rapsolje",
    "categoryId": "torr",
    "unitPriceNok": 54
  },
  {
    "displayName": "Sesamolje",
    "categoryId": "torr",
    "unitPriceNok": 57
  },
  {
    "displayName": "Soyasaus",
    "categoryId": "torr",
    "unitPriceNok": 60
  },
  {
    "displayName": "Worcestersaus",
    "categoryId": "torr",
    "unitPriceNok": 63
  },
  {
    "displayName": "Fish sauce",
    "categoryId": "torr",
    "unitPriceNok": 12
  },
  {
    "displayName": "Sriracha",
    "categoryId": "torr",
    "unitPriceNok": 15
  },
  {
    "displayName": "Ketchup",
    "categoryId": "torr",
    "unitPriceNok": 18
  },
  {
    "displayName": "Sennep",
    "categoryId": "torr",
    "unitPriceNok": 21
  },
  {
    "displayName": "Dijonsennep",
    "categoryId": "torr",
    "unitPriceNok": 24
  },
  {
    "displayName": "Majones",
    "categoryId": "torr",
    "unitPriceNok": 27
  },
  {
    "displayName": "Buljong terning",
    "categoryId": "torr",
    "unitPriceNok": 30
  },
  {
    "displayName": "Tomatpuré",
    "categoryId": "torr",
    "unitPriceNok": 33
  },
  {
    "displayName": "Passata",
    "categoryId": "torr",
    "unitPriceNok": 36
  },
  {
    "displayName": "Hermetiske tomater",
    "categoryId": "torr",
    "unitPriceNok": 39
  },
  {
    "displayName": "Bønner i tomatsaus",
    "categoryId": "torr",
    "unitPriceNok": 42
  },
  {
    "displayName": "Kidneyboks",
    "categoryId": "torr",
    "unitPriceNok": 45
  },
  {
    "displayName": "Baconbiter boks",
    "categoryId": "torr",
    "unitPriceNok": 48
  },
  {
    "displayName": "Oliven grønne",
    "categoryId": "torr",
    "unitPriceNok": 51
  },
  {
    "displayName": "Oliven sorte",
    "categoryId": "torr",
    "unitPriceNok": 54
  },
  {
    "displayName": "Kapers",
    "categoryId": "torr",
    "unitPriceNok": 57
  },
  {
    "displayName": "Sylteagurk",
    "categoryId": "torr",
    "unitPriceNok": 60
  },
  {
    "displayName": "Syltet rødløk",
    "categoryId": "torr",
    "unitPriceNok": 63
  },
  {
    "displayName": "Honning",
    "categoryId": "torr",
    "unitPriceNok": 12
  },
  {
    "displayName": "Sirup lønnesirup",
    "categoryId": "torr",
    "unitPriceNok": 15
  },
  {
    "displayName": "Sukkersirup",
    "categoryId": "torr",
    "unitPriceNok": 18
  },
  {
    "displayName": "Syltetøy bringebær",
    "categoryId": "torr",
    "unitPriceNok": 21
  },
  {
    "displayName": "Syltetøy jordbær",
    "categoryId": "torr",
    "unitPriceNok": 24
  },
  {
    "displayName": "Nutella",
    "categoryId": "torr",
    "unitPriceNok": 27
  },
  {
    "displayName": "Peanøttsmør",
    "categoryId": "torr",
    "unitPriceNok": 30
  },
  {
    "displayName": "Mandler",
    "categoryId": "torr",
    "unitPriceNok": 33
  },
  {
    "displayName": "Rosiner",
    "categoryId": "torr",
    "unitPriceNok": 36
  },
  {
    "displayName": "Soltørka aprikos",
    "categoryId": "torr",
    "unitPriceNok": 39
  },
  {
    "displayName": "Fiken tørr",
    "categoryId": "torr",
    "unitPriceNok": 42
  },
  {
    "displayName": "Dadler",
    "categoryId": "torr",
    "unitPriceNok": 45
  },
  {
    "displayName": "Kokosflak",
    "categoryId": "torr",
    "unitPriceNok": 48
  },
  {
    "displayName": "Kakaopulver",
    "categoryId": "torr",
    "unitPriceNok": 51
  },
  {
    "displayName": "Bakekakosjokolade",
    "categoryId": "torr",
    "unitPriceNok": 54
  },
  {
    "displayName": "Vaniljesukker",
    "categoryId": "torr",
    "unitPriceNok": 57
  },
  {
    "displayName": "Puddingpulver",
    "categoryId": "torr",
    "unitPriceNok": 60
  },
  {
    "displayName": "Gelatin",
    "categoryId": "torr",
    "unitPriceNok": 63
  },
  {
    "displayName": "Vaffelrøre",
    "categoryId": "torr",
    "unitPriceNok": 12
  },
  {
    "displayName": "Croutonger",
    "categoryId": "torr",
    "unitPriceNok": 15
  },
  {
    "displayName": "Brødsmuler",
    "categoryId": "torr",
    "unitPriceNok": 18
  },
  {
    "displayName": "Panko",
    "categoryId": "torr",
    "unitPriceNok": 21
  },
  {
    "displayName": "Risnudler",
    "categoryId": "torr",
    "unitPriceNok": 24
  },
  {
    "displayName": "Eggnudler",
    "categoryId": "torr",
    "unitPriceNok": 27
  },
  {
    "displayName": "Instantnudler",
    "categoryId": "torr",
    "unitPriceNok": 30
  },
  {
    "displayName": "Popcorn kern",
    "categoryId": "torr",
    "unitPriceNok": 33
  },
  {
    "displayName": "Taco skjell",
    "categoryId": "torr",
    "unitPriceNok": 36
  },
  {
    "displayName": "Tortilla",
    "categoryId": "torr",
    "unitPriceNok": 39
  },
  {
    "displayName": "Tacokrydder",
    "categoryId": "torr",
    "unitPriceNok": 42
  },
  {
    "displayName": "Chili con carne boks",
    "categoryId": "torr",
    "unitPriceNok": 45
  },
  {
    "displayName": "Surdeigsstarter",
    "categoryId": "torr",
    "unitPriceNok": 48
  },
  {
    "displayName": "Smultringmix",
    "categoryId": "torr",
    "unitPriceNok": 51
  },
  {
    "displayName": "Knekkebrød rug",
    "categoryId": "torr",
    "unitPriceNok": 54
  },
  {
    "displayName": "Erter frost",
    "categoryId": "fryse",
    "unitPriceNok": 28
  },
  {
    "displayName": "Spinat frost",
    "categoryId": "fryse",
    "unitPriceNok": 32
  },
  {
    "displayName": "Brokkoli frost",
    "categoryId": "fryse",
    "unitPriceNok": 35
  },
  {
    "displayName": "Wokblanding frost",
    "categoryId": "fryse",
    "unitPriceNok": 38
  },
  {
    "displayName": "Grønnsaksblanding",
    "categoryId": "fryse",
    "unitPriceNok": 36
  },
  {
    "displayName": "Fiskegrateng",
    "categoryId": "fryse",
    "unitPriceNok": 68
  },
  {
    "displayName": "Fiskepinner frost",
    "categoryId": "fryse",
    "unitPriceNok": 52
  },
  {
    "displayName": "Pizza Grandiosa",
    "categoryId": "fryse",
    "unitPriceNok": 48
  },
  {
    "displayName": "Pizza fryst",
    "categoryId": "fryse",
    "unitPriceNok": 55
  },
  {
    "displayName": "Vaniljeis",
    "categoryId": "fryse",
    "unitPriceNok": 65
  },
  {
    "displayName": "Sjokoladeis",
    "categoryId": "fryse",
    "unitPriceNok": 68
  },
  {
    "displayName": "Is pinne",
    "categoryId": "fryse",
    "unitPriceNok": 42
  },
  {
    "displayName": "Frosne bær",
    "categoryId": "fryse",
    "unitPriceNok": 45
  },
  {
    "displayName": "Pommes frites",
    "categoryId": "fryse",
    "unitPriceNok": 38
  },
  {
    "displayName": "Hash browns",
    "categoryId": "fryse",
    "unitPriceNok": 42
  },
  {
    "displayName": "Lapskaus",
    "categoryId": "fryse",
    "unitPriceNok": 58
  },
  {
    "displayName": "Lasagne frost",
    "categoryId": "fryse",
    "unitPriceNok": 72
  },
  {
    "displayName": "Kjøttboller frost",
    "categoryId": "fryse",
    "unitPriceNok": 62
  },
  {
    "displayName": "Kylling nuggets",
    "categoryId": "fryse",
    "unitPriceNok": 55
  },
  {
    "displayName": "Vårruller",
    "categoryId": "fryse",
    "unitPriceNok": 48
  },
  {
    "displayName": "Kaffe filter",
    "categoryId": "drikke",
    "unitPriceNok": 85
  },
  {
    "displayName": "Kaffe espresso",
    "categoryId": "drikke",
    "unitPriceNok": 95
  },
  {
    "displayName": "Te sort",
    "categoryId": "drikke",
    "unitPriceNok": 48
  },
  {
    "displayName": "Te grønn",
    "categoryId": "drikke",
    "unitPriceNok": 52
  },
  {
    "displayName": "Te kamille",
    "categoryId": "drikke",
    "unitPriceNok": 45
  },
  {
    "displayName": "Saft solbær",
    "categoryId": "drikke",
    "unitPriceNok": 38
  },
  {
    "displayName": "Saft appelsin",
    "categoryId": "drikke",
    "unitPriceNok": 36
  },
  {
    "displayName": "Brus cola",
    "categoryId": "drikke",
    "unitPriceNok": 32
  },
  {
    "displayName": "Brus appelsin",
    "categoryId": "drikke",
    "unitPriceNok": 32
  },
  {
    "displayName": "Mineralvann kullsyre",
    "categoryId": "drikke",
    "unitPriceNok": 22
  },
  {
    "displayName": "Mineralvann naturell",
    "categoryId": "drikke",
    "unitPriceNok": 20
  },
  {
    "displayName": "Eplejuice",
    "categoryId": "drikke",
    "unitPriceNok": 38
  },
  {
    "displayName": "Appelsinjuice",
    "categoryId": "drikke",
    "unitPriceNok": 36
  },
  {
    "displayName": "Smoothie flaske",
    "categoryId": "drikke",
    "unitPriceNok": 42
  },
  {
    "displayName": "Iskaffe flaske",
    "categoryId": "drikke",
    "unitPriceNok": 45
  },
  {
    "displayName": "Chai latte klar",
    "categoryId": "drikke",
    "unitPriceNok": 38
  },
  {
    "displayName": "Kakao pulver",
    "categoryId": "drikke",
    "unitPriceNok": 48
  },
  {
    "displayName": "Energy drink",
    "categoryId": "drikke",
    "unitPriceNok": 22
  },
  {
    "displayName": "Vitaminvann",
    "categoryId": "drikke",
    "unitPriceNok": 28
  },
  {
    "displayName": "Kokosvann",
    "categoryId": "drikke",
    "unitPriceNok": 32
  },
  {
    "displayName": "Tørkerull",
    "categoryId": "annet",
    "unitPriceNok": 35
  },
  {
    "displayName": "Bakepapir",
    "categoryId": "annet",
    "unitPriceNok": 28
  },
  {
    "displayName": "Aluminiumsfolie",
    "categoryId": "annet",
    "unitPriceNok": 42
  },
  {
    "displayName": "Plastfolie",
    "categoryId": "annet",
    "unitPriceNok": 38
  },
  {
    "displayName": "Ziplock poser",
    "categoryId": "annet",
    "unitPriceNok": 32
  },
  {
    "displayName": "Søppelposer",
    "categoryId": "annet",
    "unitPriceNok": 45
  },
  {
    "displayName": "Oppvaskmiddel",
    "categoryId": "annet",
    "unitPriceNok": 38
  },
  {
    "displayName": "Håndsåpe",
    "categoryId": "annet",
    "unitPriceNok": 32
  },
  {
    "displayName": "Tannpasta",
    "categoryId": "annet",
    "unitPriceNok": 42
  },
  {
    "displayName": "Skuresvamp",
    "categoryId": "annet",
    "unitPriceNok": 18
  },
  {
    "displayName": "Isposer",
    "categoryId": "annet",
    "unitPriceNok": 15
  },
  {
    "displayName": "Telys",
    "categoryId": "annet",
    "unitPriceNok": 28
  },
  {
    "displayName": "Fyrstikker",
    "categoryId": "annet",
    "unitPriceNok": 22
  },
  {
    "displayName": "Batteri AA",
    "categoryId": "annet",
    "unitPriceNok": 48
  },
  {
    "displayName": "Rengjøringsspray",
    "categoryId": "annet",
    "unitPriceNok": 42
  },
  {
    "displayName": "Tørkepapir",
    "categoryId": "annet",
    "unitPriceNok": 38
  },
  {
    "displayName": "Skuremiddel",
    "categoryId": "annet",
    "unitPriceNok": 35
  },
  {
    "displayName": "Glassrengjøring",
    "categoryId": "annet",
    "unitPriceNok": 32
  },
  {
    "displayName": "Tøymykner",
    "categoryId": "annet",
    "unitPriceNok": 55
  },
  {
    "displayName": "Vaskepulver",
    "categoryId": "annet",
    "unitPriceNok": 68
  }
]

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
