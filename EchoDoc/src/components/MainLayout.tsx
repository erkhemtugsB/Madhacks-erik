import { useState, useEffect } from 'react'
import { PDFViewer } from './PDFViewer'
import { NoteStream } from './NoteStream'
import { ConnectionCard } from './ConnectionCard'
import { DocumentCard } from './DocumentCard'
import { TranscriptLog } from './TranscriptLog'
import { StatusIndicator } from './StatusIndicator'
import { useStore } from '../store/useStore'
import type { Note } from '../shared/types'
import { io, Socket } from 'socket.io-client'

export function MainLayout() {
    const { notes, pdfPage, setPdfPage, addNote, setNotes, role, roomCode, setMeetingStatus, setRole, setRoomCode } = useStore()
    const [file, setFile] = useState<string | null>(null)
    const [isRecording, setIsRecording] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
    const [socket, setSocket] = useState<Socket | null>(null)

    useEffect(() => {
        if (window.electron) {
            // Common IPC listeners
            const handleNotesList = (notes: Note[]) => setNotes(notes)
            const handleNoteCreated = (note: Note) => addNote(note)

            // Host-specific logic
            if (role === 'host') {
                setConnectionStatus('connected')
                window.electron.ipcRenderer.on('notes-list', handleNotesList)
                window.electron.ipcRenderer.on('note-created', handleNoteCreated)
                window.electron.ipcRenderer.send('get-notes', {})

                // Connect to local socket for audio streaming
                console.log('Host connecting to local socket...')
                const newSocket = io('http://localhost:3000')
                setSocket(newSocket)

                newSocket.on('connect', () => {
                    console.log('Host connected to socket')
                    newSocket.emit('join', { name: 'Host', deviceId: 'electron-host' })
                })
            }

            // Guest-specific logic
            if (role === 'guest') {
                setConnectionStatus('connecting')

                const handleHostFound = ({ ip }: { ip: string }) => {
                    console.log('Connecting to host:', ip)
                    const newSocket = io(`http://${ip}:3000`)
                    setSocket(newSocket)

                    newSocket.on('connect', () => {
                        setConnectionStatus('connected')
                        newSocket.emit('join', { name: 'Guest', deviceId: 'electron-guest' })
                    })

                    newSocket.on('disconnect', () => setConnectionStatus('disconnected'))

                    newSocket.on('note-created', (note: Note) => addNote(note))
                    newSocket.on('transcript-update', (text, isFinal, speaker) => {
                        // Handle transcript if needed
                    })

                    newSocket.on('file-shared', (url: string) => {
                        console.log('Received file URL:', url)
                        setFile(url)
                    })
                }

                const cleanup = window.electron.ipcRenderer.on('host-found', handleHostFound)

                return () => {
                    cleanup()
                }
            }
        }
    }, [role])

    // Cleanup socket on unmount
    useEffect(() => {
        return () => {
            if (socket) socket.disconnect()
        }
    }, [socket])

    const handlePageChange = (page: number) => {
        setPdfPage(page)
    }

    const handleNoteClick = (page: number) => {
        setPdfPage(page)
    }

    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)

    const handleStartRecording = async () => {
        try {
            console.log('Requesting microphone access...')
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            console.log('Microphone access granted')

            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
            setMediaRecorder(recorder)

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0 && socket) {
                    console.log('Sending audio chunk:', event.data.size)
                    socket.emit('audio-chunk', event.data)
                }
            }

            recorder.start(250) // Send chunks every 250ms
            console.log('MediaRecorder started')

            window.electron?.ipcRenderer.send('start-audio', {})
            setIsRecording(true)
        } catch (error) {
            console.error('Error starting recording:', error)
        }
    }

    const handleStopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop()
            mediaRecorder.stream.getTracks().forEach(track => track.stop())
            setMediaRecorder(null)
            console.log('MediaRecorder stopped')
        }
        window.electron?.ipcRenderer.send('stop-audio', {})
        setIsRecording(false)
    }

    const handleFileSelected = (filePath: string) => {
        setFile(filePath)
    }

    const handleExit = () => {
        if (role === 'host') {
            window.electron?.ipcRenderer.send('end-meeting', {})
        } else {
            window.electron?.ipcRenderer.send('leave-meeting', {})
        }
        setMeetingStatus('idle')
        setRole(null)
        setRoomCode(null)
        setFile(null)
        setNotes([])
        setIsRecording(false)
        setConnectionStatus('disconnected')
    }

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-50">
            {/* Header */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between shadow-sm z-10">
                <h1 className="font-bold text-xl text-gray-800">EchoDoc</h1>

                <div className="flex items-center gap-4">
                    <StatusIndicator status={connectionStatus} label={isRecording ? "Recording" : undefined} />

                    {role === 'host' && (
                        <button
                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                            className={`px-4 py-2 rounded font-bold text-white transition-colors ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
                                }`}
                        >
                            {isRecording ? 'Stop Recording' : 'Start Recording'}
                        </button>
                    )}

                    {role && (
                        <button
                            onClick={handleExit}
                            className={`px-4 py-2 rounded font-bold text-white transition-colors ${role === 'host'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-yellow-500 hover:bg-yellow-600'
                                }`}
                        >
                            {role === 'host' ? 'End Meeting' : 'Leave Meeting'}
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content - 3 Column Layout */}
            <div className="flex-1 flex overflow-hidden p-6 gap-6">

                {/* Left Sidebar - 300px */}
                <div className="w-[300px] flex flex-col gap-4">
                    <ConnectionCard />
                    <DocumentCard onFileSelected={handleFileSelected} currentFile={file} />
                    <TranscriptLog />
                </div>

                {/* Center - PDF Viewer (Flexible) */}
                <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative flex flex-col">
                    {file ? (
                        <PDFViewer file={file} pageNumber={pdfPage} onPageChange={handlePageChange} />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                            <p className="text-2xl font-serif text-gray-800 mb-4">Hello, world!</p>
                            <p className="text-sm">Select a document to begin</p>
                        </div>
                    )}
                </div>

                {/* Right Sidebar - 350px */}
                <div className="w-[350px] flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <NoteStream notes={notes} onNoteClick={handleNoteClick} />
                </div>
            </div>
        </div>
    )
}
