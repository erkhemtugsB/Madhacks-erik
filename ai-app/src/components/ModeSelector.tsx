import { useState } from 'react'
import { useStore } from '../store/useStore'
import type { AudioMode } from '../shared/types'

const MODE_OPTIONS: { value: AudioMode; label: string; description: string }[] = [
    {
        value: 'OFFLINE_COLLAB',
        label: 'Mode A: Offline Collaboration',
        description: 'Host + Guest audio mixing'
    },
    {
        value: 'OFFLINE_LECTURE',
        label: 'Mode B: Instructor Mode',
        description: 'Host only + Guest signals'
    },
    {
        value: 'ONLINE_MEETING',
        label: 'Mode C: Screen-share + Narration',
        description: 'System audio + Host mic'
    }
]

export function ModeSelector() {
    const { mode, setMode } = useStore()
    const [isExpanded, setIsExpanded] = useState(false)

    const handleModeChange = (newMode: AudioMode) => {
        setMode(newMode)
        // Send IPC message to Electron main process
        if (window.electron) {
            window.electron.ipcRenderer.send('change-mode', { mode: newMode })
        }
        setIsExpanded(false)
    }

    const currentModeOption = MODE_OPTIONS.find(opt => opt.value === mode)

    return (
        <div className="panel relative">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-left flex items-center justify-between"
            >
                <div>
                    <div className="font-semibold text-sm">{currentModeOption?.label}</div>
                    <div className="text-xs text-gray-500">{currentModeOption?.description}</div>
                </div>
                <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
            </button>

            {isExpanded && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {MODE_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleModeChange(option.value)}
                            className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${option.value === mode ? 'bg-green-50 border-l-4 border-green-500' : ''
                                }`}
                        >
                            <div className="font-semibold text-sm">{option.label}</div>
                            <div className="text-xs text-gray-500">{option.description}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
