import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Set worker URL to match the package version
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
    file: string | null
    pageNumber: number
    onPageChange: (page: number) => void
}

export function PDFViewer({ file, pageNumber, onPageChange }: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0)

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages)
    }

    return (
        <div className="flex flex-col items-center bg-gray-100 h-full overflow-auto p-4">
            {file ? (
                <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="shadow-lg"
                >
                    <Page
                        pageNumber={pageNumber}
                        width={600}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                    />
                </Document>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                    No PDF loaded
                </div>
            )}

            {file && (
                <div className="mt-4 flex gap-4 items-center">
                    <button
                        disabled={pageNumber <= 1}
                        onClick={() => onPageChange(pageNumber - 1)}
                        className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
                    >
                        Prev
                    </button>
                    <span>
                        Page {pageNumber} of {numPages}
                    </span>
                    <button
                        disabled={pageNumber >= numPages}
                        onClick={() => onPageChange(pageNumber + 1)}
                        className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}
