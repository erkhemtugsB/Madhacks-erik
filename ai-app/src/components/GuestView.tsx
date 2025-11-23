import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '../shared/types'

export function GuestView() {
    const [isConnected, setIsConnected] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [guestName, setGuestName] = useState('')
    const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)

    useEffect(() => {
        // Connect to the host
        // In Guest mode, we connect to the host IP. 
        // Since we are serving from the host, we can use window.location.hostname
        const socket = io(`http://${window.location.hostname}:3000`)
        socketRef.current = socket

        socket.on('connect', () => {
            setIsConnected(true)
        })

        socket.on('disconnect', () => {
            setIsConnected(false)
            setIsRecording(false)
        })

        return () => {
            socket.disconnect()
        }
    }, [])

    const handleJoin = () => {
        if (!guestName.trim() || !socketRef.current) return
        socketRef.current.emit('join', {
            name: guestName,
            deviceId: 'web-guest' // In real app, generate unique ID
        })
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && socketRef.current) {
                    event.data.arrayBuffer().then(buffer => {
                        socketRef.current?.emit('audio-chunk', buffer)
                    })
                }
            }

            mediaRecorder.start(100) // Send chunks every 100ms
            setIsRecording(true)
        } catch (err) {
            console.error('Error accessing microphone:', err)
            alert('Could not access microphone')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
            setIsRecording(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4">
            <h1 className="text-2xl font-bold mb-8">EchoDoc Guest</h1>

            {!isConnected ? (
                <div className="text-yellow-500">Connecting to Host...</div>
            ) : (
                <div className="w-full max-w-md space-y-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-gray-400">Your Name</label>
                        <input
                            type="text"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded p-2 text-white"
                            placeholder="Enter your name"
                        />
                        <button
                            onClick={handleJoin}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium"
                        >
                            Join Meeting
                        </button>
                    </div>

                    <div className="border-t border-gray-800 pt-6 flex justify-center">
                        <button
                            onMouseDown={startRecording}
                            onMouseUp={stopRecording}
                            onTouchStart={startRecording}
                            onTouchEnd={stopRecording}
                            className={`w-32 h-32 rounded-full flex items-center justify-center text-xl font-bold transition-all ${isRecording
                                ? 'bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] scale-110'
                                : 'bg-gray-700 hover:bg-gray-600'
                                }`}
                        >
                            {isRecording ? 'Recording' : 'Hold to Talk'}
                        </button>
                    </div>

                    <p className="text-center text-gray-500 text-sm">
                        {isRecording ? 'Transmitting audio...' : 'Press and hold to speak'}
                    </p>
                </div>
            )}
        </div>
    )
}
