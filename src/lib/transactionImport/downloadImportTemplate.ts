/** Nedlasting av tom CSV-mal (Excel-kompatibel, semikolon, UTF-8 BOM). */
export function downloadTransactionImportTemplate(): void {
  const header = 'DATO;TRANSAKSJON;KATEGORI;BELØP;Beskrivelse'
  const bom = '\uFEFF'
  const blob = new Blob([bom + header + '\n'], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'smart-budsjett-transaksjoner-mal.csv'
  a.click()
  URL.revokeObjectURL(url)
}
