import { useState, useRef } from 'react'
import { FileText, Upload } from 'lucide-react'

interface DocumentCardProps {
    onFileSelected: (path: string) => void
    currentFile: string | null
}

export function DocumentCard({ onFileSelected, currentFile }: DocumentCardProps) {
    const [files, setFiles] = useState<Array<{ name: string, path: string }>>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            console.log('File selected:', file.name)

            // Upload to main process via IPC
            const reader = new FileReader()
            reader.onload = (e) => {
                window.electron?.ipcRenderer.send('upload-pdf', {
                    filename: file.name,
                    data: e.target?.result
                })

                // Wait for response with saved file path
                const cleanup = window.electron?.ipcRenderer.on('pdf-uploaded', (response: any) => {
                    if (response.success) {
                        // Backend now returns localhost URL, use it directly
                        const newFile = { name: file.name, path: response.path }
                        setFiles(prev => [...prev, newFile])
                        onFileSelected(response.path)
                        console.log('PDF uploaded successfully:', response.path)
                    } else {
                        console.error('PDF upload failed:', response.error)
                    }
                    cleanup?.()
                })
            }
            reader.readAsArrayBuffer(file)
        }
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col gap-3 h-64">
            <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    PDF Document
                </label>
                {files.length > 0 && (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        + Add New
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                {files.length === 0 ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-300 hover:bg-gray-50 transition-colors gap-2 p-4 text-center"
                    >
                        <Upload className="w-8 h-8 text-gray-300" />
                        <div>
                            <p className="text-sm font-bold text-gray-600">Drag & drop PDF here</p>
                            <p className="text-xs text-gray-400">or click to select file</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                        {files.map((file, idx) => (
                            <div
                                key={idx}
                                onClick={() => onFileSelected(file.path)}
                                className={`p-2 rounded border flex items-center gap-3 cursor-pointer transition-colors ${currentFile === file.path
                                    ? 'bg-indigo-50 border-indigo-200'
                                    : 'bg-white border-gray-100 hover:border-gray-300'
                                    }`}
                            >
                                <div className={`p-1.5 rounded ${currentFile === file.path ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                                    <FileText className={`w-4 h-4 ${currentFile === file.path ? 'text-indigo-600' : 'text-gray-500'}`} />
                                </div>
                                <span className={`text-sm truncate ${currentFile === file.path ? 'text-indigo-900 font-medium' : 'text-gray-600'}`}>
                                    {file.name}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <input
                type="file"
                accept="application/pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />
        </div>
    )
}
