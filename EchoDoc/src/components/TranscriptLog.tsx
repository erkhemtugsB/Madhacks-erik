import { useEffect, useRef, useState } from 'react'

export function TranscriptLog() {
    const [logs, setLogs] = useState<string[]>([])
    const endRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (window.electron) {
            const handleTranscript = (text: string, isFinal: boolean, speaker?: string) => {
                const timestamp = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
                const speakerLabel = speaker || 'Speaker 0'
                const logEntry = `[${timestamp}] ${speakerLabel}: ${text}`

                setLogs(prev => {
                    const newLogs = [...prev, logEntry]
                    if (newLogs.length > 50) return newLogs.slice(-50) // Keep last 50 lines
                    return newLogs
                })
            }

            const cleanup = window.electron.ipcRenderer.on('transcript-update', handleTranscript)
            return cleanup
        }
    }, [])

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    return (
        <div className="flex-1 bg-gray-100 rounded-lg border border-gray-200 p-3 overflow-hidden flex flex-col">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                Raw Transcript Stream
            </label>
            <div className="flex-1 overflow-y-auto font-mono text-[10px] text-gray-600 space-y-1">
                {logs.length === 0 && (
                    <span className="text-gray-400 italic">Waiting for audio...</span>
                )}
                {logs.map((log, i) => (
                    <div key={i} className="break-words leading-tight">
                        {log}
                    </div>
                ))}
                <div ref={endRef} />
            </div>
        </div>
    )
}
