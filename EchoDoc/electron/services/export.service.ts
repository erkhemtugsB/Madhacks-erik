import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import type { Note } from '../../src/shared/types'

export class ExportService {
    public async generateMeetingSummary(originalPdfPath: string, notes: Note[]) {
        try {
            // Filter only page-specific notes
            const pageNotes = notes.filter(n => n.pageNumber !== null && n.pageNumber !== undefined)

            const existingPdfBytes = fs.readFileSync(originalPdfPath)
            const pdfDoc = await PDFDocument.load(existingPdfBytes)
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
            const pages = pdfDoc.getPages()

            for (const note of pageNotes) {
                if (note.pageNumber && note.pageNumber <= pages.length) {
                    const pageIndex = note.pageNumber - 1
                    const page = pages[pageIndex]
                    const { width, height } = page.getSize()

                    // Draw sticky note background (Yellow)
                    const noteWidth = 200
                    const noteHeight = 100
                    const x = width - noteWidth - 20
                    const y = height - noteHeight - 20

                    page.drawRectangle({
                        x,
                        y,
                        width: noteWidth,
                        height: noteHeight,
                        color: rgb(1, 1, 0.8), // Light yellow
                        borderColor: rgb(0.8, 0.8, 0),
                        borderWidth: 1,
                    })

                    // Draw text
                    const fontSize = 10
                    page.drawText(note.content, {
                        x: x + 5,
                        y: y + noteHeight - 15,
                        size: fontSize,
                        font: helveticaFont,
                        color: rgb(0, 0, 0),
                        maxWidth: noteWidth - 10,
                        lineHeight: 12,
                    })
                }
            }

            const pdfBytes = await pdfDoc.save()

            // Save to Documents/EchoDoc_Exports
            const documentsPath = app.getPath('documents')
            const exportDir = path.join(documentsPath, 'EchoDoc_Exports')

            if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir, { recursive: true })
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
            const exportPath = path.join(exportDir, `Meeting_${timestamp}_Annotated.pdf`)

            fs.writeFileSync(exportPath, pdfBytes)
            console.log(`Exported annotated PDF to: ${exportPath}`)

            return exportPath
        } catch (error) {
            console.error('PDF export failed:', error)
            throw error
        }
    }

    public generateMarkdownSummary(notes: Note[], pdfPath: string): string {
        try {
            const documentsPath = app.getPath('documents')
            const exportDir = path.join(documentsPath, 'EchoDoc_Exports')

            if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir, { recursive: true })
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

            let markdown = `# Meeting Summary - ${new Date().toLocaleDateString()}\n\n`
            markdown += `**PDF Document**: ${path.basename(pdfPath)}\n\n`
            markdown += `---\n\n`

            // Orphaned notes (global discussions)
            const orphanedNotes = notes.filter(n => !n.pageNumber)
            if (orphanedNotes.length > 0) {
                markdown += `## Global Discussions\n\n`
                orphanedNotes.forEach((note, i) => {
                    const preview = note.content.length > 50 ? note.content.substring(0, 50) + '...' : note.content
                    markdown += `### ${i + 1}. ${preview}\n\n`
                    markdown += `${note.content}\n\n`
                    markdown += `*Created: ${new Date(note.createdAt).toLocaleString()}*\n\n`
                    markdown += `---\n\n`
                })
            }

            // Page-specific notes as backup
            const pageNotes = notes.filter(n => n.pageNumber)
            if (pageNotes.length > 0) {
                markdown += `## Page-Specific Notes\n\n`
                pageNotes.forEach(note => {
                    markdown += `- **Page ${note.pageNumber}**: ${note.content}\n`
                })
            }

            const mdPath = path.join(exportDir, `Meeting_${timestamp}_Summary.md`)
            fs.writeFileSync(mdPath, markdown, 'utf-8')
            console.log(`Exported markdown summary to: ${mdPath}`)

            return mdPath
        } catch (error) {
            console.error('Markdown export failed:', error)
            throw error
        }
    }
}
