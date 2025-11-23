import fs from 'fs'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

export class PDFService {
    /**
     * Parses a PDF file and extracts text with page delimiters
     * @param filePath Absolute path to the PDF file
     * @returns Full text with [[PAGE_N]] delimiters
     */
    public async parsePdf(filePath: string): Promise<string> {
        try {
            const dataBuffer = fs.readFileSync(filePath)
            const arrayBuffer = new Uint8Array(dataBuffer).buffer

            const loadingTask = pdfjsLib.getDocument(arrayBuffer)
            const doc = await loadingTask.promise

            let fullText = ''

            console.log(`PDF parsed: ${doc.numPages} pages extracted with delimiters.`)

            // Iterate page-by-page for precise extraction
            for (let i = 1; i <= doc.numPages; i++) {
                const page = await doc.getPage(i)
                const content = await page.getTextContent()
                const strings = content.items.map((item: any) => item.str)
                const pageText = strings.join(' ')

                fullText += `[[PAGE_${i}]]\n${pageText}\n\n`
            }

            return fullText.trim()
        } catch (error) {
            console.error('PDF parsing failed:', error)
            throw error
        }
    }
}
