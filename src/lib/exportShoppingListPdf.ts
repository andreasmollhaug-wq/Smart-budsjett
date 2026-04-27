/**
 * Klient-side PDF fra handleliste-DOM (html2canvas + jsPDF).
 * Rot-elementet som fanges må ha denne id-en (html2canvas kloner DOM og flytter den til synlig posisjon).
 */
export const SHOPPING_LIST_PDF_CAPTURE_ROOT_ID = 'shopping-list-pdf-print-root'

export async function exportShoppingListPdf(element: HTMLElement, filename: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    onclone: (clonedDoc) => {
      try {
        const node = clonedDoc.getElementById(SHOPPING_LIST_PDF_CAPTURE_ROOT_ID)
        if (!node) return
        node.style.position = 'relative'
        node.style.left = '0'
        node.style.top = '0'
        node.style.transform = 'none'
        node.style.margin = '0'
        const win = clonedDoc.defaultView
        if (!win) return
        let p: HTMLElement | null = node.parentElement
        let depth = 0
        while (p && depth < 6) {
          let pos = 'static'
          try {
            pos = win.getComputedStyle(p).position
          } catch {
            /* klonet DOM i noen miljøer kan gi feil ved getComputedStyle */
          }
          if (pos === 'fixed' || pos === 'absolute') {
            p.style.position = 'relative'
            p.style.left = '0'
            p.style.top = '0'
            p.style.transform = 'none'
          }
          p = p.parentElement
          depth += 1
        }
      } catch {
        /* ikke la onclone krasje hele eksporten */
      }
    },
  })

  if (canvas.width < 2 || canvas.height < 2) {
    throw new Error('PDF-grunnlaget ble tomt (0 px).')
  }

  const imgData = canvas.toDataURL('image/png', 1.0)
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pdfWidth
  const imgHeight = (canvas.height * pdfWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pdfHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pdfHeight
  }

  pdf.save(filename)
}
