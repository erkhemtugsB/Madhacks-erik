import { useState } from 'react'
import { useStore } from '../store/useStore'

export function ConnectionCard() {
    const { role, setRole, roomCode, setRoomCode, setMeetingStatus } = useStore()
    const [inputCode, setInputCode] = useState('')

    const handleHost = () => {
        if (!inputCode) return
        setRoomCode(inputCode)
        setRole('host')
        setMeetingStatus('active')
        window.electron?.ipcRenderer.send('start-host', { roomCode: inputCode })
    }

    const handleJoin = () => {
        if (!inputCode) return
        setRoomCode(inputCode)
        setRole('guest')
        setMeetingStatus('active')
        window.electron?.ipcRenderer.send('join-meeting', { roomCode: inputCode })
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col gap-4">
            {/* Mode Selection (Visual Only for now) */}
            <div className="relative">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1 block">
                    Mode
                </label>
                <div className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 flex justify-between items-center cursor-not-allowed opacity-75">
                    <span>Mode A: Offline Collaboration</span>
                    <span className="text-xs text-gray-400">▼</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Host + Guest audio mixing</p>
            </div>

            {/* Connection Controls */}
            {!role ? (
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                        Connection
                    </label>
                    <input
                        type="text"
                        placeholder="Enter Room Code (e.g. 8888)"
                        className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                    />
                    <div className="flex gap-2 mt-1">
                        <button
                            onClick={handleHost}
                            disabled={!inputCode}
                            className="flex-1 bg-indigo-600 text-white text-xs font-bold py-2 px-3 rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            Host Meeting
                        </button>
                        <button
                            onClick={handleJoin}
                            disabled={!inputCode}
                            className="flex-1 bg-white border border-gray-300 text-gray-700 text-xs font-bold py-2 px-3 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            Join Meeting
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded text-center">
                        <p className="text-xs text-emerald-600 font-bold uppercase">Connected as {role}</p>
                        <p className="text-lg font-mono font-bold text-emerald-800">{roomCode}</p>
                    </div>
                </div>
            )}
        </div>
    )
}
